import crypto from 'node:crypto';
import type {
  Project,
  ProjectScript,
  StoryboardData,
  StoryboardScene,
  ProductionTask,
  ManualHandoffSpec,
} from '@creatorflow/shared';
import { DirectedAcyclicGraph } from './dag.js';

function computeIdempotencyKey(projectId: string, taskKey: string, payload: Record<string, any>): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${projectId}:${taskKey}:${JSON.stringify(payload)}`);
  return hash.digest('hex').substring(0, 32);
}

export class DAGCompiler {
  compile(
    project: Project,
    script: ProjectScript,
    storyboard: StoryboardData,
  ): DirectedAcyclicGraph {
    const tasks: ProductionTask[] = [];

    // Task 1: Script Approval (Checkpoint)
    const scriptApprovalKey = computeIdempotencyKey(project.id, 'script_approval', { scriptVersion: script.version });
    const taskScriptApproval: ProductionTask = {
      id: `task_script_approval`,
      projectId: project.id,
      type: 'SCRIPT_APPROVAL',
      name: 'Script Review & Creative Approval',
      state: script.approved ? 'completed' : 'awaiting_approval',
      prerequisiteTaskIds: [],
      mode: 'local',
      inputPayload: { scriptId: script.id, version: script.version },
      outputPayload: script.approved ? { approved: true, approvedAt: script.approvedAt } : undefined,
      idempotencyKey: scriptApprovalKey,
      attempts: 1,
      maxAttempts: 1,
      completedAt: script.approved ? script.approvedAt : undefined,
    };
    tasks.push(taskScriptApproval);

    // Task 2: Storyboard Generation
    const storyboardKey = computeIdempotencyKey(project.id, 'storyboard_gen', { sceneCount: storyboard.scenes.length });
    const taskStoryboardGen: ProductionTask = {
      id: `task_storyboard_gen`,
      projectId: project.id,
      type: 'STORYBOARD_GENERATION',
      name: 'Storyboard & Scene Prompt Compilation',
      state: script.approved ? 'completed' : 'pending',
      prerequisiteTaskIds: ['task_script_approval'],
      mode: 'local',
      inputPayload: { sceneCount: storyboard.scenes.length },
      outputPayload: { sceneCount: storyboard.scenes.length, totalDurationSeconds: storyboard.totalDurationSeconds },
      idempotencyKey: storyboardKey,
      attempts: 1,
      maxAttempts: 3,
      completedAt: script.approved ? new Date().toISOString() : undefined,
    };
    tasks.push(taskStoryboardGen);

    const videoQATaskIds: string[] = [];
    const audioQATaskIds: string[] = [];

    // Per-scene generation and validation tasks
    for (const scene of storyboard.scenes) {
      const sceneNum = scene.sceneNumber;

      // 1. Scene Prompt Optimization Task
      const promptOptTaskId = `task_prompt_opt_scene_${sceneNum}`;
      const promptOptKey = computeIdempotencyKey(project.id, promptOptTaskId, { prompt: scene.providerPrompt });
      const taskPromptOpt: ProductionTask = {
        id: promptOptTaskId,
        projectId: project.id,
        sceneId: `scene_${sceneNum}`,
        type: 'SCENE_PROMPT_OPTIMIZATION',
        name: `Optimize Prompts for Scene ${sceneNum}`,
        state: script.approved ? 'completed' : 'pending',
        prerequisiteTaskIds: ['task_storyboard_gen'],
        mode: 'local',
        inputPayload: {
          visualDescription: scene.visualDescription,
          provider: scene.suggestedProvider,
          aspectRatio: scene.aspectRatio,
        },
        outputPayload: {
          optimizedPrompt: scene.providerPrompt,
          negativePrompt: scene.negativePrompt,
        },
        idempotencyKey: promptOptKey,
        attempts: 1,
        maxAttempts: 3,
        completedAt: script.approved ? new Date().toISOString() : undefined,
      };
      tasks.push(taskPromptOpt);

      // 2. Video Generation Task (API or Manual Handoff)
      const videoTaskId = `task_video_scene_${sceneNum}`;
      const isManualHandoff = scene.suggestedProvider.includes('google_flow') || scene.suggestedProvider.includes('runway') || scene.suggestedProvider.includes('midjourney');
      const manualHandoffSpec: ManualHandoffSpec = {
        providerName: scene.suggestedProvider === 'google_flow' ? 'Google Flow' : 'Runway Gen-3',
        providerUrl: scene.suggestedProvider === 'google_flow' ? 'https://labs.google/flow' : 'https://app.runwayml.com',
        prompt: scene.providerPrompt,
        negativePrompt: scene.negativePrompt,
        parameters: {
          aspectRatio: scene.aspectRatio,
          durationSeconds: scene.durationSeconds,
          cameraMotion: scene.cameraMotion,
        },
        instructions: [
          `Open ${scene.suggestedProvider === 'google_flow' ? 'Google Flow' : 'Runway'} in your browser.`,
          `Copy and paste the production-ready prompt into the prompt box.`,
          `Set aspect ratio to ${scene.aspectRatio} and target duration to ${scene.durationSeconds}s.`,
          `Generate the clip, download the MP4 result, and upload it using the dropzone below.`,
        ],
      };

      const videoKey = computeIdempotencyKey(project.id, videoTaskId, { prompt: scene.providerPrompt, duration: scene.durationSeconds });
      const taskVideo: ProductionTask = {
        id: videoTaskId,
        projectId: project.id,
        sceneId: `scene_${sceneNum}`,
        type: 'VIDEO_GENERATION',
        name: `Generate Video for Scene ${sceneNum} (${manualHandoffSpec.providerName})`,
        state: script.approved ? (isManualHandoff ? 'awaiting_external_action' : 'ready') : 'pending',
        prerequisiteTaskIds: [promptOptTaskId],
        mode: isManualHandoff ? 'manual_handoff' : 'api',
        providerId: scene.suggestedProvider,
        inputPayload: {
          prompt: scene.providerPrompt,
          negativePrompt: scene.negativePrompt,
          durationSeconds: scene.durationSeconds,
          aspectRatio: scene.aspectRatio,
        },
        manualHandoffSpec,
        idempotencyKey: videoKey,
        attempts: 0,
        maxAttempts: 3,
      };
      tasks.push(taskVideo);

      // 3. Video Asset Validation Task (FFprobe inspection)
      const videoQATaskId = `task_qa_video_scene_${sceneNum}`;
      videoQATaskIds.push(videoQATaskId);
      const videoQAKey = computeIdempotencyKey(project.id, videoQATaskId, { videoTaskId });
      const taskVideoQA: ProductionTask = {
        id: videoQATaskId,
        projectId: project.id,
        sceneId: `scene_${sceneNum}`,
        type: 'ASSET_VALIDATION',
        name: `Validate Video Asset (Scene ${sceneNum})`,
        state: 'pending',
        prerequisiteTaskIds: [videoTaskId],
        mode: 'local',
        inputPayload: { targetDurationSeconds: scene.durationSeconds, expectedAspectRatio: scene.aspectRatio },
        idempotencyKey: videoQAKey,
        attempts: 0,
        maxAttempts: 3,
      };
      tasks.push(taskVideoQA);

      // 4. Audio Narration Task (Parallel to video generation)
      if (scene.narrationEnabled && scene.narrationText) {
        const audioTaskId = `task_audio_scene_${sceneNum}`;
        const audioKey = computeIdempotencyKey(project.id, audioTaskId, { text: scene.narrationText });
        const taskAudio: ProductionTask = {
          id: audioTaskId,
          projectId: project.id,
          sceneId: `scene_${sceneNum}`,
          type: 'AUDIO_NARRATION',
          name: `Synthesize Narration for Scene ${sceneNum}`,
          state: script.approved ? 'ready' : 'pending',
          prerequisiteTaskIds: ['task_script_approval'], // Non-blocking: runs concurrently with video!
          mode: 'local',
          providerId: 'tts_engine',
          inputPayload: {
            text: scene.narrationText,
            language: project.language,
            style: project.narrationStyle,
          },
          idempotencyKey: audioKey,
          attempts: 0,
          maxAttempts: 3,
        };
        tasks.push(taskAudio);

        const audioQATaskId = `task_qa_audio_scene_${sceneNum}`;
        audioQATaskIds.push(audioQATaskId);
        const audioQAKey = computeIdempotencyKey(project.id, audioQATaskId, { audioTaskId });
        const taskAudioQA: ProductionTask = {
          id: audioQATaskId,
          projectId: project.id,
          sceneId: `scene_${sceneNum}`,
          type: 'ASSET_VALIDATION',
          name: `Validate Audio Asset (Scene ${sceneNum})`,
          state: 'pending',
          prerequisiteTaskIds: [audioTaskId],
          mode: 'local',
          inputPayload: { text: scene.narrationText },
          idempotencyKey: audioQAKey,
          attempts: 0,
          maxAttempts: 3,
        };
        tasks.push(taskAudioQA);
      }
    }

    // Task: Music Selection (Runs in parallel with scene generation)
    const musicTaskId = 'task_music_selection';
    const musicKey = computeIdempotencyKey(project.id, musicTaskId, { style: project.visualStyle });
    const taskMusic: ProductionTask = {
      id: musicTaskId,
      projectId: project.id,
      type: 'MUSIC_SELECTION',
      name: 'Select & Score Background Music',
      state: script.approved ? 'ready' : 'pending',
      prerequisiteTaskIds: ['task_script_approval'],
      mode: 'local',
      inputPayload: { category: project.category, durationSeconds: project.durationSeconds },
      idempotencyKey: musicKey,
      attempts: 0,
      maxAttempts: 3,
    };
    tasks.push(taskMusic);

    // Task: Timeline Assembly (Depends on all validated video assets + audio + music)
    const assemblyPrereqs = [...videoQATaskIds, ...audioQATaskIds, musicTaskId];
    const assemblyKey = computeIdempotencyKey(project.id, 'timeline_assembly', { prereqs: assemblyPrereqs });
    const taskAssembly: ProductionTask = {
      id: 'task_assembly',
      projectId: project.id,
      type: 'TIMELINE_ASSEMBLY',
      name: 'Multitrack Timeline Assembly (FFmpeg)',
      state: 'pending',
      prerequisiteTaskIds: assemblyPrereqs,
      mode: 'local',
      inputPayload: { totalDurationSeconds: storyboard.totalDurationSeconds, aspectRatio: project.aspectRatio },
      idempotencyKey: assemblyKey,
      attempts: 0,
      maxAttempts: 3,
    };
    tasks.push(taskAssembly);

    // Task: Final QA Verification
    const finalQAKey = computeIdempotencyKey(project.id, 'final_qa', { assemblyTaskId: 'task_assembly' });
    const taskFinalQA: ProductionTask = {
      id: 'task_qa',
      projectId: project.id,
      type: 'QUALITY_ASSURANCE',
      name: 'Deterministic Quality Assurance Inspection',
      state: 'pending',
      prerequisiteTaskIds: ['task_assembly'],
      mode: 'local',
      inputPayload: { projectId: project.id },
      idempotencyKey: finalQAKey,
      attempts: 0,
      maxAttempts: 3,
    };
    tasks.push(taskFinalQA);

    // Task: Final Export & Delivery
    const exportKey = computeIdempotencyKey(project.id, 'export_delivery', { qaTaskId: 'task_qa' });
    const taskExport: ProductionTask = {
      id: 'task_export',
      projectId: project.id,
      type: 'EXPORT',
      name: 'Final MP4 Package & Delivery',
      state: 'pending',
      prerequisiteTaskIds: ['task_qa'],
      mode: 'local',
      inputPayload: { projectId: project.id },
      idempotencyKey: exportKey,
      attempts: 0,
      maxAttempts: 3,
    };
    tasks.push(taskExport);

    const dag = new DirectedAcyclicGraph(tasks);
    const validation = dag.validate();
    if (!validation.isValid) {
      throw new Error(`Compiled DAG is invalid: ${JSON.stringify(validation)}`);
    }

    return dag;
  }
}

