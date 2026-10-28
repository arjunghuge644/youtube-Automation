import type {
  Project,
  ProjectScript,
  ProjectScenePlan,
  ProjectStoryboard,
  ProductionJob,
  ProductionState,
  ScriptData,
  ScenePlanData,
  StoryboardData,
  UpdateScriptInput,
  UpdateScenePlanInput,
  UpdateStoryboardInput,
  ProductionTask,
  Asset,
  QaResult,
} from '@creatorflow/shared';
import { ApiError } from './errors.js';
import type { Models } from './models.js';
import type { Planner } from './planner/types.js';
import { ProductionStateMachine } from './state-machine.js';
import { DAGCompiler } from './orchestration/dag-compiler.js';
import { TaskManager } from './orchestration/task-manager.js';
import { AutomatedProductionOrchestrator } from './orchestration/auto-orchestrator.js';

export interface ProductionManagerDependencies {
  models: Models;
  planner: Planner;
}

export class ProductionManager {
  private models: Models;
  private planner: Planner;
  private dagCompiler = new DAGCompiler();
  private taskManager: TaskManager;
  private autoOrchestrator: AutomatedProductionOrchestrator;

  constructor({ models, planner }: ProductionManagerDependencies) {
    this.models = models;
    this.planner = planner;
    this.taskManager = new TaskManager(models);
    this.autoOrchestrator = new AutomatedProductionOrchestrator(models);
  }

  async getProductionState(projectId: string, ownerId: string): Promise<ProductionState> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null });
    if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found.');

    const [script, scenePlan, storyboard, latestJob] = await Promise.all([
      this.models.Script.findOne({ projectId, ownerId }),
      this.models.ScenePlan.findOne({ projectId, ownerId }),
      this.models.Storyboard.findOne({ projectId, ownerId }),
      this.models.ProductionJob.findOne({ projectId, ownerId }).sort({ createdAt: -1 }),
    ]);

    return {
      projectStatus: project.status as any,
      category: (project.category || 'educational') as any,
      hasScript: Boolean(script),
      scriptApproved: Boolean(script?.approved),
      scriptVersion: script?.version,
      hasScenePlan: Boolean(scenePlan),
      scenePlanApproved: Boolean(scenePlan?.approved),
      scenePlanVersion: scenePlan?.version,
      hasStoryboard: Boolean(storyboard),
      storyboardApproved: Boolean(storyboard?.approved),
      storyboardVersion: storyboard?.version,
      activeJob: latestJob ? this.serializeJob(latestJob) : undefined,
    };
  }

  async getScript(projectId: string, ownerId: string): Promise<ProjectScript> {
    const script = await this.models.Script.findOne({ projectId, ownerId });
    if (!script) throw new ApiError(404, 'SCRIPT_NOT_FOUND', 'No script has been generated for this project yet.');
    return this.serializeScript(script);
  }

  async getScenePlan(projectId: string, ownerId: string): Promise<ProjectScenePlan> {
    const plan = await this.models.ScenePlan.findOne({ projectId, ownerId });
    if (!plan) throw new ApiError(404, 'SCENE_PLAN_NOT_FOUND', 'No scene plan has been generated for this project yet.');
    return this.serializeScenePlan(plan);
  }

  async getStoryboard(projectId: string, ownerId: string): Promise<ProjectStoryboard> {
    const storyboard = await this.models.Storyboard.findOne({ projectId, ownerId });
    if (!storyboard) throw new ApiError(404, 'STORYBOARD_NOT_FOUND', 'No storyboard has been generated for this project yet.');
    return this.serializeStoryboard(storyboard);
  }

  async startScriptGeneration(project: Project, ownerId: string): Promise<ProductionJob> {
    ProductionStateMachine.assertCanStartScriptGeneration(project.status);

    await this.models.Project.updateOne({ _id: project.id, ownerId }, { status: 'SCRIPT_GENERATING' });

    const job = await this.models.ProductionJob.create({
      ownerId,
      projectId: project.id,
      jobType: 'SCRIPT_GENERATION',
      status: 'PROCESSING',
      progress: 15,
    });

    void this.executeScriptGeneration(project, ownerId, job._id.toString());
    return this.serializeJob(job);
  }

  private async executeScriptGeneration(project: Project, ownerId: string, jobId: string): Promise<void> {
    try {
      const generatedScript = await this.planner.generateScript(project);
      await this.models.ProductionJob.updateOne({ _id: jobId }, { progress: 60 });

      const existingScript = await this.models.Script.findOne({ projectId: project.id, ownerId });
      let scriptDoc;

      if (existingScript) {
        await this.models.ScriptVersion.create({
          ownerId,
          projectId: project.id,
          scriptId: existingScript._id,
          version: existingScript.version,
          snapshot: existingScript.toObject(),
        });

        existingScript.title = generatedScript.title;
        existingScript.hook = generatedScript.hook;
        existingScript.scenes = generatedScript.scenes as any;
        existingScript.totalDurationSeconds = generatedScript.totalDurationSeconds;
        existingScript.version += 1;
        existingScript.approved = false;
        existingScript.approvedAt = null as any;
        scriptDoc = await existingScript.save();
      } else {
        scriptDoc = await this.models.Script.create({
          ownerId,
          projectId: project.id,
          title: generatedScript.title,
          hook: generatedScript.hook,
          scenes: generatedScript.scenes,
          totalDurationSeconds: generatedScript.totalDurationSeconds,
          version: 1,
          approved: false,
        });
      }

      await this.models.Project.updateOne({ _id: project.id, ownerId }, { status: 'SCRIPT_REVIEW' });
      await this.models.ProductionJob.updateOne({ _id: jobId }, { status: 'COMPLETED', progress: 100 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Script generation failed.';
      await this.models.Project.updateOne({ _id: project.id, ownerId }, { status: 'FAILED' });
      await this.models.ProductionJob.updateOne({ _id: jobId }, { status: 'FAILED', error: message });
    }
  }

  async updateScript(projectId: string, ownerId: string, input: UpdateScriptInput): Promise<ProjectScript> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null });
    if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found.');

    const script = await this.models.Script.findOne({ projectId, ownerId });
    if (!script) throw new ApiError(404, 'SCRIPT_NOT_FOUND', 'No script to update.');

    ProductionStateMachine.assertCanEditScript(project.status as any, script.approved);

    if (script.version !== input.expectedVersion) {
      throw new ApiError(409, 'VERSION_CONFLICT', `Script was updated by another process. Expected version ${input.expectedVersion}, but found version ${script.version}.`);
    }

    await this.models.ScriptVersion.create({
      ownerId,
      projectId,
      scriptId: script._id,
      version: script.version,
      snapshot: script.toObject(),
    });

    script.title = input.title;
    script.hook = input.hook;
    script.scenes = input.scenes as any;
    script.totalDurationSeconds = input.totalDurationSeconds;
    script.version += 1;
    await script.save();

    return this.serializeScript(script);
  }

  async approveScript(projectId: string, ownerId: string): Promise<ProjectScript> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null });
    if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found.');

    const script = await this.models.Script.findOne({ projectId, ownerId });
    ProductionStateMachine.assertCanApproveScript(project.status as any, Boolean(script));

    script!.approved = true;
    script!.approvedAt = new Date();
    await script!.save();

    // Transition script approval task in DAG if tasks already exist
    await this.taskManager.transitionState(projectId, 'task_script_approval', ownerId, 'completed', {
      outputPayload: { approved: true, approvedAt: script!.approvedAt },
    }).catch(() => {});

    return this.serializeScript(script!);
  }

  // --- Storyboard Management ---

  async generateStoryboard(projectId: string, ownerId: string): Promise<ProjectStoryboard> {
    const projectDoc = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null }).lean();
    if (!projectDoc) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');

    const scriptDoc = await this.models.Script.findOne({ projectId, ownerId });
    if (!scriptDoc) throw new ApiError(400, 'SCRIPT_REQUIRED', 'A script must be generated before planning a storyboard.');

    const project: Project = {
      id: projectDoc._id.toString(),
      ownerId: projectDoc.ownerId.toString(),
      title: projectDoc.title,
      prompt: projectDoc.prompt,
      category: (projectDoc.category || 'educational') as any,
      language: projectDoc.language as any,
      durationSeconds: projectDoc.durationSeconds,
      aspectRatio: projectDoc.aspectRatio as any,
      visualStyle: (projectDoc.visualStyle || 'cinematic') as any,
      narrationStyle: projectDoc.narrationStyle as any,
      narrationEnabled: projectDoc.narrationEnabled ?? true,
      audience: projectDoc.audience,
      resolution: projectDoc.resolution as any,
      status: projectDoc.status as any,
      version: projectDoc.version,
      createdAt: projectDoc.createdAt.toISOString(),
      updatedAt: projectDoc.updatedAt.toISOString(),
    };

    const scriptData: ScriptData = {
      title: scriptDoc.title,
      hook: scriptDoc.hook,
      scenes: scriptDoc.scenes as any,
      totalDurationSeconds: scriptDoc.totalDurationSeconds,
    };

    const generatedStoryboard = await this.planner.generateStoryboard(project, scriptData);

    const existing = await this.models.Storyboard.findOne({ projectId, ownerId });
    let doc;

    if (existing) {
      await this.models.StoryboardVersion.create({
        ownerId,
        projectId,
        storyboardId: existing._id,
        version: existing.version,
        snapshot: existing.toObject(),
      });

      existing.title = generatedStoryboard.title;
      existing.scenes = generatedStoryboard.scenes as any;
      existing.totalDurationSeconds = generatedStoryboard.totalDurationSeconds;
      existing.version += 1;
      existing.approved = false;
      existing.approvedAt = null as any;
      doc = await existing.save();
    } else {
      doc = await this.models.Storyboard.create({
        ownerId,
        projectId,
        title: generatedStoryboard.title,
        scenes: generatedStoryboard.scenes,
        totalDurationSeconds: generatedStoryboard.totalDurationSeconds,
        version: 1,
        approved: false,
      });
    }

    // Automatically compile and persist production DAG
    await this.compileProductionDAG(projectId, ownerId);

    return this.serializeStoryboard(doc);
  }

  async updateStoryboard(projectId: string, ownerId: string, input: UpdateStoryboardInput): Promise<ProjectStoryboard> {
    const storyboard = await this.models.Storyboard.findOne({ projectId, ownerId });
    if (!storyboard) throw new ApiError(404, 'STORYBOARD_NOT_FOUND', 'No storyboard to update.');

    if (storyboard.version !== input.expectedVersion) {
      throw new ApiError(409, 'VERSION_CONFLICT', `Storyboard changed in another session. Expected version ${input.expectedVersion}, but found version ${storyboard.version}.`);
    }

    await this.models.StoryboardVersion.create({
      ownerId,
      projectId,
      storyboardId: storyboard._id,
      version: storyboard.version,
      snapshot: storyboard.toObject(),
    });

    storyboard.title = input.title;
    storyboard.scenes = input.scenes as any;
    storyboard.totalDurationSeconds = input.totalDurationSeconds;
    storyboard.version += 1;
    await storyboard.save();

    // Re-compile DAG with updated scenes
    await this.compileProductionDAG(projectId, ownerId);

    return this.serializeStoryboard(storyboard);
  }

  async approveStoryboard(projectId: string, ownerId: string): Promise<ProjectStoryboard> {
    const storyboard = await this.models.Storyboard.findOne({ projectId, ownerId });
    if (!storyboard) throw new ApiError(404, 'STORYBOARD_NOT_FOUND', 'No storyboard to approve.');

    storyboard.approved = true;
    storyboard.approvedAt = new Date();
    await storyboard.save();

    // Complete storyboard task and unlock downstream ready tasks in DAG
    await this.taskManager.transitionState(projectId, 'task_storyboard_gen', ownerId, 'completed', {
      outputPayload: { approved: true, approvedAt: storyboard.approvedAt },
    }).catch(() => {});

    return this.serializeStoryboard(storyboard);
  }

  // --- Production DAG & Workflow Management ---

  async compileProductionDAG(projectId: string, ownerId: string): Promise<ProductionTask[]> {
    const projectDoc = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null }).lean();
    if (!projectDoc) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');

    const scriptDoc = await this.models.Script.findOne({ projectId, ownerId });
    if (!scriptDoc) throw new ApiError(400, 'SCRIPT_REQUIRED', 'Script required to compile DAG.');

    const storyboardDoc = await this.models.Storyboard.findOne({ projectId, ownerId });
    if (!storyboardDoc) throw new ApiError(400, 'STORYBOARD_REQUIRED', 'Storyboard required to compile DAG.');

    const project: Project = {
      id: projectDoc._id.toString(),
      ownerId: projectDoc.ownerId.toString(),
      title: projectDoc.title,
      prompt: projectDoc.prompt,
      category: (projectDoc.category || 'educational') as any,
      language: projectDoc.language as any,
      durationSeconds: projectDoc.durationSeconds,
      aspectRatio: projectDoc.aspectRatio as any,
      visualStyle: (projectDoc.visualStyle || 'cinematic') as any,
      narrationStyle: projectDoc.narrationStyle as any,
      narrationEnabled: projectDoc.narrationEnabled ?? true,
      audience: projectDoc.audience,
      resolution: projectDoc.resolution as any,
      status: projectDoc.status as any,
      version: projectDoc.version,
      createdAt: projectDoc.createdAt.toISOString(),
      updatedAt: projectDoc.updatedAt.toISOString(),
    };

    const script: ProjectScript = {
      id: scriptDoc._id.toString(),
      projectId,
      title: scriptDoc.title,
      hook: scriptDoc.hook,
      scenes: scriptDoc.scenes as any,
      totalDurationSeconds: scriptDoc.totalDurationSeconds,
      version: scriptDoc.version,
      approved: scriptDoc.approved,
      approvedAt: scriptDoc.approvedAt ? scriptDoc.approvedAt.toISOString() : undefined,
      createdAt: scriptDoc.createdAt.toISOString(),
      updatedAt: scriptDoc.updatedAt.toISOString(),
    };

    const storyboardData: StoryboardData = {
      projectId,
      title: storyboardDoc.title,
      scenes: storyboardDoc.scenes as any,
      totalDurationSeconds: storyboardDoc.totalDurationSeconds,
    };

    const dag = this.dagCompiler.compile(project, script, storyboardData);
    return this.taskManager.persistDAG(projectId, ownerId, dag);
  }

  async getTasks(projectId: string, ownerId: string): Promise<ProductionTask[]> {
    return this.taskManager.getTasksForProject(projectId, ownerId);
  }

  async approveTask(projectId: string, taskId: string, ownerId: string): Promise<ProductionTask> {
    return this.taskManager.approveTask(projectId, taskId, ownerId);
  }

  async ingestAndValidateVideoHandoff(projectId: string, taskId: string, ownerId: string, filePath: string) {
    return this.autoOrchestrator.ingestAndValidateVideoHandoff(projectId, taskId, ownerId, filePath);
  }

  async regenerateScene(projectId: string, sceneId: string, ownerId: string): Promise<ProductionTask[]> {
    const targetTaskId = `task_video_${sceneId}`;
    return this.taskManager.invalidateAndRegenerate(projectId, targetTaskId, ownerId);
  }

  async getQaReport(projectId: string, ownerId: string): Promise<QaResult | null> {
    const task = await this.models.Task.findOne({ projectId, taskId: 'task_qa', ownerId });
    if (task && task.outputPayload) {
      return task.outputPayload as QaResult;
    }
    return null;
  }

  async getAssets(projectId: string, ownerId: string): Promise<Asset[]> {
    const docs = await this.models.Asset.find({ projectId, ownerId }).sort({ createdAt: 1 });
    return docs.map((doc) => ({
      id: doc._id.toString(),
      projectId,
      sceneId: doc.sceneId || undefined,
      taskId: doc.taskId,
      provider: doc.provider,
      type: doc.type as any,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      durationSeconds: doc.durationSeconds,
      width: doc.width || undefined,
      height: doc.height || undefined,
      checksum: doc.checksum,
      isValidated: doc.isValidated,
      validationReport: doc.validationReport || undefined,
      createdAt: doc.createdAt.toISOString(),
    }));
  }

  // --- Scene Plan (Legacy 3D Simulation compatibility) ---

  async startScenePlanning(project: Project, ownerId: string): Promise<ProductionJob> {
    const script = await this.models.Script.findOne({ projectId: project.id, ownerId });
    ProductionStateMachine.assertCanStartScenePlanning(project.status, Boolean(script?.approved));

    await this.models.Project.updateOne({ _id: project.id, ownerId }, { status: 'SCENES_GENERATING' });

    const job = await this.models.ProductionJob.create({
      ownerId,
      projectId: project.id,
      jobType: 'SCENE_PLANNING',
      status: 'PROCESSING',
      progress: 20,
    });

    void this.executeScenePlanning(project, ownerId, this.serializeScript(script!), job._id.toString());
    return this.serializeJob(job);
  }

  private async executeScenePlanning(project: Project, ownerId: string, script: ScriptData, jobId: string): Promise<void> {
    try {
      const generatedPlan = await this.planner.generateScenePlan(project, script);
      await this.models.ProductionJob.updateOne({ _id: jobId }, { progress: 60 });

      const existingPlan = await this.models.ScenePlan.findOne({ projectId: project.id, ownerId });
      let planDoc;

      if (existingPlan) {
        await this.models.ScenePlanVersion.create({
          ownerId,
          projectId: project.id,
          scenePlanId: existingPlan._id,
          version: existingPlan.version,
          snapshot: existingPlan.toObject(),
        });

        existingPlan.scenes = generatedPlan.scenes as any;
        existingPlan.totalDurationSeconds = generatedPlan.totalDurationSeconds;
        existingPlan.version += 1;
        existingPlan.approved = false;
        existingPlan.approvedAt = null as any;
        planDoc = await existingPlan.save();
      } else {
        planDoc = await this.models.ScenePlan.create({
          ownerId,
          projectId: project.id,
          scenes: generatedPlan.scenes,
          totalDurationSeconds: generatedPlan.totalDurationSeconds,
          version: 1,
          approved: false,
        });
      }

      await this.models.Project.updateOne({ _id: project.id, ownerId }, { status: 'SCENES_REVIEW' });
      await this.models.ProductionJob.updateOne({ _id: jobId }, { status: 'COMPLETED', progress: 100 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scene planning failed.';
      await this.models.Project.updateOne({ _id: project.id, ownerId }, { status: 'FAILED' });
      await this.models.ProductionJob.updateOne({ _id: jobId }, { status: 'FAILED', error: message });
    }
  }

  async updateScenePlan(projectId: string, ownerId: string, input: UpdateScenePlanInput): Promise<ProjectScenePlan> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null });
    if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found.');

    const plan = await this.models.ScenePlan.findOne({ projectId, ownerId });
    if (!plan) throw new ApiError(404, 'SCENE_PLAN_NOT_FOUND', 'No scene plan to update.');

    ProductionStateMachine.assertCanEditScenePlan(project.status as any, plan.approved);

    if (plan.version !== input.expectedVersion) {
      throw new ApiError(409, 'VERSION_CONFLICT', `Scene plan was updated by another process. Expected version ${input.expectedVersion}, but found version ${plan.version}.`);
    }

    await this.models.ScenePlanVersion.create({
      ownerId,
      projectId,
      scenePlanId: plan._id,
      version: plan.version,
      snapshot: plan.toObject(),
    });

    plan.scenes = input.scenes as any;
    plan.totalDurationSeconds = input.totalDurationSeconds;
    plan.version += 1;
    await plan.save();

    return this.serializeScenePlan(plan);
  }

  async approveScenePlan(projectId: string, ownerId: string): Promise<ProjectScenePlan> {
    const project = await this.models.Project.findOne({ _id: projectId, ownerId, deletedAt: null });
    if (!project) throw new ApiError(404, 'NOT_FOUND', 'Project not found.');

    const plan = await this.models.ScenePlan.findOne({ projectId, ownerId });
    ProductionStateMachine.assertCanApproveScenePlan(project.status as any, Boolean(plan));

    plan!.approved = true;
    plan!.approvedAt = new Date();
    await plan!.save();

    await this.models.Project.updateOne({ _id: projectId, ownerId }, { status: 'READY_TO_RENDER' });
    return this.serializeScenePlan(plan!);
  }

  // --- Serializers ---

  private serializeScript(doc: any): ProjectScript {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId.toString(),
      title: doc.title,
      hook: doc.hook,
      scenes: doc.scenes.map((s: any) => ({
        sceneNumber: s.sceneNumber,
        title: s.title,
        narration: s.narration,
        visualDescription: s.visualDescription,
        durationSeconds: s.durationSeconds,
      })),
      totalDurationSeconds: doc.totalDurationSeconds,
      version: doc.version,
      approved: doc.approved,
      approvedAt: doc.approvedAt ? doc.approvedAt.toISOString() : undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private serializeStoryboard(doc: any): ProjectStoryboard {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId.toString(),
      title: doc.title,
      scenes: doc.scenes.map((s: any) => ({
        sceneNumber: s.sceneNumber,
        title: s.title,
        durationSeconds: s.durationSeconds,
        visualDescription: s.visualDescription,
        cameraMotion: s.cameraMotion,
        lighting: s.lighting,
        providerPrompt: s.providerPrompt,
        negativePrompt: s.negativePrompt,
        narrationText: s.narrationText,
        narrationEnabled: s.narrationEnabled,
        suggestedProvider: s.suggestedProvider,
        aspectRatio: s.aspectRatio,
      })),
      totalDurationSeconds: doc.totalDurationSeconds,
      version: doc.version,
      approved: doc.approved,
      approvedAt: doc.approvedAt ? doc.approvedAt.toISOString() : undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private serializeScenePlan(doc: any): ProjectScenePlan {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId.toString(),
      scenes: doc.scenes.map((s: any) => ({
        id: s.id,
        sceneNumber: s.sceneNumber,
        sceneType: s.sceneType || 'content',
        durationSeconds: s.durationSeconds,
        visualDescription: s.visualDescription,
        renderStrategy: s.renderStrategy,
        audio: {
          narrationEnabled: s.audio?.narrationEnabled ?? true,
          text: s.audio?.text,
          language: s.audio?.language,
          volume: s.audio?.volume ?? 1,
        },
        subtitles: (s.subtitles || []).map((sub: any) => ({
          text: sub.text,
          startSeconds: sub.startSeconds,
          endSeconds: sub.endSeconds,
        })),
        textOverlays: (s.textOverlays || []).map((t: any) => ({
          text: t.text,
          position: t.position,
          startSeconds: t.startSeconds,
          endSeconds: t.endSeconds,
        })),
        transition: s.transition || 'fade',
      })),
      totalDurationSeconds: doc.totalDurationSeconds,
      version: doc.version,
      approved: doc.approved,
      approvedAt: doc.approvedAt ? doc.approvedAt.toISOString() : undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  private serializeJob(doc: any): ProductionJob {
    return {
      id: doc._id.toString(),
      projectId: doc.projectId.toString(),
      jobType: doc.jobType,
      status: doc.status,
      progress: doc.progress,
      error: doc.error ?? undefined,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}
