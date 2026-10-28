import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  Project,
  ProjectScript,
  StoryboardData,
  ProductionTask,
  Asset,
  QaResult,
} from '@creatorflow/shared';
import { ApiError } from '../errors.js';
import type { Models } from '../models.js';
import { TaskManager } from './task-manager.js';
import { AssetValidator } from '../media/asset-validator.js';
import { TTSService } from '../providers/tts/tts-service.js';
import { TimelineSynchronizer } from '../media/synchronizer.js';
import { SubtitleGenerator } from '../media/subtitle-generator.js';
import { TimelineAssembler } from '../media/timeline-assembler.js';
import { QAEngine } from '../media/qa-engine.js';

export class AutomatedProductionOrchestrator {
  private taskManager: TaskManager;
  private assetValidator: AssetValidator;
  private ttsService: TTSService;
  private timelineSynchronizer: TimelineSynchronizer;
  private subtitleGenerator: SubtitleGenerator;
  private timelineAssembler: TimelineAssembler;
  private qaEngine: QAEngine;

  constructor(private models: Models, ttsService?: TTSService) {
    this.taskManager = new TaskManager(models);
    this.assetValidator = new AssetValidator();
    this.ttsService = ttsService || new TTSService();
    this.timelineSynchronizer = new TimelineSynchronizer();
    this.subtitleGenerator = new SubtitleGenerator();
    this.timelineAssembler = new TimelineAssembler();
    this.qaEngine = new QAEngine();
  }

  /**
   * Manual Video Ingestion & Validation for a scene task.
   * If this completes the last required video, automatically launches post-production.
   */
  async ingestAndValidateVideoHandoff(
    projectId: string,
    taskId: string,
    ownerId: string,
    filePath: string,
  ): Promise<{
    task: ProductionTask;
    asset: Asset;
    autoProductionTriggered: boolean;
    qaResult?: QaResult;
    exportPath?: string;
  }> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null }).lean();
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');

    const task = await this.models.Task.findOne({ projectId, taskId, ownerId });
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${taskId} not found.`);

    if (task.state !== 'awaiting_external_action' && task.mode !== 'manual_handoff') {
      throw new ApiError(400, 'INVALID_TASK_STATE', `Task ${taskId} is not awaiting video handoff (state: ${task.state}).`);
    }

    // 1. Technical validation with FFprobe
    const validationReport = await this.assetValidator.validateVideoAsset(filePath, {
      expectedAspectRatio: (project.aspectRatio || '9:16') as any,
    });

    if (!validationReport.valid) {
      task.state = 'failed';
      task.error = `Video validation failed: ${validationReport.issues.join('; ')}`;
      await task.save();

      await this.models.ProductionEvent.create({
        ownerId,
        projectId,
        taskId,
        eventType: 'ASSET_VALIDATION_FAILED',
        newState: 'failed',
        details: { validationReport, filePath },
      });

      throw new ApiError(422, 'VALIDATION_FAILED', `Uploaded clip failed FFprobe validation: ${validationReport.issues.join('; ')}`);
    }

    // 2. Measure duration, resolution and calculate checksum
    const probe = await this.assetValidator.inspectMedia(filePath);
    const videoStream = probe.streams?.find((s: any) => s.codec_type === 'video');
    const durationSeconds = parseFloat(videoStream?.duration || probe.format?.duration || '5.0');
    const width = videoStream?.width;
    const height = videoStream?.height;

    const fileBuffer = await fs.readFile(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 3. Mark video task complete and save asset metadata
    const { task: completedTask, asset } = await this.taskManager.completeManualHandoff(
      projectId,
      taskId,
      ownerId,
      {
        filePath,
        mimeType: 'video/mp4',
        durationSeconds: Number(durationSeconds.toFixed(2)),
        checksum,
        width,
        height,
      },
    );

    // Save validation report in asset
    await this.models.Asset.updateOne(
      { _id: asset.id },
      { $set: { isValidated: true, validationReport } },
    );
    asset.isValidated = true;
    asset.validationReport = validationReport;

    // Also complete the QA validation task for this scene
    if (task.sceneId) {
      const qaTaskId = `task_qa_video_${task.sceneId}`;
      await this.models.Task.updateOne(
        { projectId, taskId: qaTaskId, ownerId },
        {
          state: 'completed',
          completedAt: new Date(),
          outputPayload: { validationReport, validatedAt: new Date().toISOString() },
        },
      );
    }

    // 4. Check if all required videos are now ready; if so, trigger automated post-production
    const postProd = await this.triggerPostProductionIfReady(projectId, ownerId);

    return {
      task: completedTask,
      asset,
      autoProductionTriggered: postProd.triggered,
      qaResult: postProd.qaResult,
      exportPath: postProd.exportPath,
    };
  }

  /**
   * Check dependencies and automatically execute complete post-production pipeline:
   * Narration -> Synchronization -> Subtitles -> Assembly -> QA -> Delivery.
   */
  async triggerPostProductionIfReady(
    projectId: string,
    ownerId: string,
  ): Promise<{
    triggered: boolean;
    reason?: string;
    exportPath?: string;
    qaResult?: QaResult;
  }> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null }).lean();
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');

    const storyboardDoc = await this.models.Storyboard.findOne({ projectId, ownerId });
    if (!storyboardDoc) {
      return { triggered: false, reason: 'No storyboard found.' };
    }

    const scriptDoc = await this.models.Script.findOne({ projectId, ownerId });
    if (!scriptDoc) {
      return { triggered: false, reason: 'No script found.' };
    }

    const storyboard: StoryboardData = {
      projectId,
      title: storyboardDoc.title,
      scenes: storyboardDoc.scenes as any,
      totalDurationSeconds: storyboardDoc.totalDurationSeconds,
    };

    // Check video generation tasks
    const tasks = await this.taskManager.getTasksForProject(projectId, ownerId);
    const videoTasks = tasks.filter((t) => t.type === 'VIDEO_GENERATION');
    const incompleteVideoTasks = videoTasks.filter((t) => t.state !== 'completed');

    if (incompleteVideoTasks.length > 0) {
      return {
        triggered: false,
        reason: `Waiting for ${incompleteVideoTasks.length} video scene(s) to be imported.`,
      };
    }

    // ALL VIDEO TASKS ARE READY!
    // Begin hands-off automated post-production:
    const serializedProject: Project = {
      id: project._id.toString(),
      ownerId: project.ownerId.toString(),
      title: project.title,
      prompt: project.prompt,
      category: (project.category || 'educational') as any,
      language: project.language as any,
      durationSeconds: project.durationSeconds,
      aspectRatio: project.aspectRatio as any,
      visualStyle: (project.visualStyle || 'cinematic') as any,
      narrationStyle: project.narrationStyle as any,
      narrationEnabled: project.narrationEnabled ?? true,
      audience: project.audience,
      resolution: project.resolution as any,
      status: project.status as any,
      version: project.version,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };

    const serializedScript: ProjectScript = {
      id: scriptDoc._id.toString(),
      projectId,
      title: scriptDoc.title,
      hook: scriptDoc.hook,
      scenes: scriptDoc.scenes as any,
      totalDurationSeconds: scriptDoc.totalDurationSeconds,
      version: scriptDoc.version,
      approved: scriptDoc.approved,
      createdAt: scriptDoc.createdAt.toISOString(),
      updatedAt: scriptDoc.updatedAt.toISOString(),
    };

    try {
      // Step A: Automated Narration Generation for any missing audio
      const audioAssets: Asset[] = [];
      for (const scene of storyboard.scenes) {
        if (!scene.narrationEnabled || !scene.narrationText) continue;

        const sceneId = `scene_${scene.sceneNumber}`;
        const taskId = `task_audio_${sceneId}`;

        // Check if audio asset already exists
        let audioDoc = await this.models.Asset.findOne({ projectId, sceneId, type: 'audio' });

        if (!audioDoc) {
          const ttsResult = await this.ttsService.synthesize({
            taskId,
            projectId,
            sceneId,
            text: scene.narrationText,
            language: project.language as any,
          });

          const checksum = crypto.createHash('md5').update(scene.narrationText).digest('hex');
          audioDoc = await this.models.Asset.create({
            ownerId,
            projectId,
            sceneId,
            taskId,
            provider: ttsResult.provider,
            type: 'audio',
            filePath: ttsResult.filePath,
            mimeType: 'audio/aac',
            durationSeconds: ttsResult.durationSeconds,
            checksum,
            isValidated: true,
          });

          await this.taskManager.transitionState(projectId, taskId, ownerId, 'completed', {
            outputPayload: { filePath: ttsResult.filePath, durationSeconds: ttsResult.durationSeconds },
          });
        }

        audioAssets.push({
          id: audioDoc._id.toString(),
          projectId,
          sceneId,
          taskId,
          provider: audioDoc.provider,
          type: 'audio',
          filePath: audioDoc.filePath,
          mimeType: audioDoc.mimeType,
          durationSeconds: audioDoc.durationSeconds,
          checksum: audioDoc.checksum,
          isValidated: audioDoc.isValidated,
          createdAt: audioDoc.createdAt.toISOString(),
        });
      }

      // Step B: Intelligent Timeline Synchronization
      const videoAssetDocs = await this.models.Asset.find({ projectId, type: 'video', isValidated: true });
      const videoAssets: Asset[] = videoAssetDocs.map((doc) => ({
        id: doc._id.toString(),
        projectId,
        sceneId: doc.sceneId || undefined,
        taskId: doc.taskId,
        provider: doc.provider,
        type: 'video',
        filePath: doc.filePath,
        mimeType: doc.mimeType,
        durationSeconds: doc.durationSeconds,
        checksum: doc.checksum,
        isValidated: doc.isValidated,
        createdAt: doc.createdAt.toISOString(),
      }));

      const manifest = this.timelineSynchronizer.synchronizeTimeline(storyboard, videoAssets, audioAssets);

      // Step C: Automated Subtitle Generation
      const srtSubtitles = [];
      let currentOffset = 0;
      for (const scene of storyboard.scenes) {
        const sceneSync = manifest.scenes.find((s) => s.sceneNumber === scene.sceneNumber);
        const sceneDuration = sceneSync ? sceneSync.finalDuration : scene.durationSeconds;
        if (scene.narrationText) {
          const chunks = this.subtitleGenerator.chunkNarration(scene.narrationText, currentOffset, sceneDuration);
          srtSubtitles.push(...chunks);
        }
        currentOffset += sceneDuration;
      }

      const subtitlesDir = path.resolve(process.cwd(), 'storage', 'projects', projectId, 'subtitles');
      const srtPath = path.join(subtitlesDir, 'subtitles.srt');
      await this.subtitleGenerator.writeSrtFile(srtSubtitles, srtPath);

      // Step D: Automated FFmpeg Timeline Assembly
      await this.taskManager.transitionState(projectId, 'task_assembly', ownerId, 'running');

      const assemblyResult = await this.timelineAssembler.assemble({
        project: serializedProject,
        storyboard,
        manifest,
        videoAssets,
        audioAssets,
        options: {
          burnSubtitles: srtSubtitles.length > 0,
          subtitleSrtPath: srtPath,
        },
      });

      await this.taskManager.transitionState(projectId, 'task_assembly', ownerId, 'completed', {
        outputPayload: assemblyResult,
      });

      // Step E: Automated Quality Assurance
      await this.taskManager.transitionState(projectId, 'task_qa', ownerId, 'running');
      const currentTasks = await this.taskManager.getTasksForProject(projectId, ownerId);

      const qaResult = await this.qaEngine.runDeterministicQA({
        project: serializedProject,
        script: serializedScript,
        storyboard,
        tasks: currentTasks,
        assets: [...videoAssets, ...audioAssets],
        finalExportPath: assemblyResult.outputPath,
        expectedDurationSeconds: manifest.totalDuration,
      });

      await this.taskManager.transitionState(projectId, 'task_qa', ownerId, 'completed', {
        outputPayload: qaResult as any,
      });

      // Step F: Export & Project State Advancement
      if (qaResult.passed) {
        await this.taskManager.transitionState(projectId, 'task_export', ownerId, 'completed', {
          outputPayload: {
            exportPath: assemblyResult.outputPath,
            qaOutcome: qaResult.outcome,
            deliveredAt: new Date().toISOString(),
          },
        });
        await this.models.Project.updateOne({ _id: projectId, ownerId }, { status: 'COMPLETED' });
      } else {
        await this.taskManager.transitionState(projectId, 'task_export', ownerId, 'failed', {
          error: 'Automated technical QA failed.',
          outputPayload: { qaResult },
        });
        await this.models.Project.updateOne({ _id: projectId, ownerId }, { status: 'FAILED' });
      }

      return {
        triggered: true,
        exportPath: assemblyResult.outputPath,
        qaResult,
      };
    } catch (error) {
      const msg = (error as Error).message;
      await this.taskManager.handleTaskFailure(projectId, 'task_assembly', ownerId, msg).catch(() => {});
      await this.models.Project.updateOne({ _id: projectId, ownerId }, { status: 'FAILED' });
      throw error;
    }
  }
}
