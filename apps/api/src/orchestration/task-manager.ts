import type {
  ProductionTask,
  TaskState,
  Asset,
} from '@creatorflow/shared';
import { ApiError } from '../errors.js';
import type { Models } from '../models.js';
import { DirectedAcyclicGraph } from './dag.js';

export class TaskManager {
  constructor(private models: Models) {}

  async getTasksForProject(projectId: string, ownerId: string): Promise<ProductionTask[]> {
    const docs = await this.models.Task.find({ projectId, ownerId }).sort({ createdAt: 1 });
    return docs.map(this.serializeTask);
  }

  async getTask(projectId: string, taskId: string, ownerId: string): Promise<ProductionTask> {
    const doc = await this.models.Task.findOne({ projectId, taskId, ownerId });
    if (!doc) {
      throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${taskId} not found.`);
    }
    return this.serializeTask(doc);
  }

  async persistDAG(projectId: string, ownerId: string, dag: DirectedAcyclicGraph): Promise<ProductionTask[]> {
    const tasks = dag.getAllTasks();
    const ops = tasks.map((task) => ({
      updateOne: {
        filter: { projectId, taskId: task.id },
        update: {
          $set: {
            ownerId,
            projectId,
            sceneId: task.sceneId || null,
            taskId: task.id,
            type: task.type,
            name: task.name,
            state: task.state,
            prerequisiteTaskIds: task.prerequisiteTaskIds,
            providerId: task.providerId || null,
            mode: task.mode,
            inputPayload: task.inputPayload,
            outputPayload: task.outputPayload || null,
            idempotencyKey: task.idempotencyKey,
            attempts: task.attempts,
            maxAttempts: task.maxAttempts,
            error: task.error || null,
            manualHandoffSpec: task.manualHandoffSpec || null,
            externalJobId: task.externalJobId || null,
            startedAt: task.startedAt ? new Date(task.startedAt) : null,
            completedAt: task.completedAt ? new Date(task.completedAt) : null,
          },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await this.models.Task.bulkWrite(ops as any);
    }

    return this.getTasksForProject(projectId, ownerId);
  }

  async transitionState(
    projectId: string,
    taskId: string,
    ownerId: string,
    newState: TaskState,
    updates: {
      outputPayload?: Record<string, any>;
      error?: string;
      externalJobId?: string;
    } = {},
  ): Promise<ProductionTask> {
    const current = await this.models.Task.findOne({ projectId, taskId, ownerId });
    if (!current) {
      throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${taskId} not found.`);
    }

    const previousState = current.state as TaskState;

    // Apply updates
    current.state = newState;
    if (updates.outputPayload !== undefined) current.outputPayload = updates.outputPayload;
    if (updates.error !== undefined) current.error = updates.error;
    if (updates.externalJobId !== undefined) current.externalJobId = updates.externalJobId;

    if (newState === 'running' && !current.startedAt) {
      current.startedAt = new Date();
    }
    if (newState === 'completed') {
      current.completedAt = new Date();
    }

    await current.save();

    // Log production audit event
    await this.models.ProductionEvent.create({
      ownerId,
      projectId,
      taskId,
      eventType: 'TASK_STATE_TRANSITION',
      previousState,
      newState,
      details: updates,
    });

    // If task completed, evaluate downstream ready tasks
    if (newState === 'completed') {
      await this.evaluateAndAdvanceDownstreamTasks(projectId, ownerId);
    }

    return this.serializeTask(current);
  }

  async approveTask(projectId: string, taskId: string, ownerId: string): Promise<ProductionTask> {
    const task = await this.models.Task.findOne({ projectId, taskId, ownerId });
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${taskId} not found.`);

    if (task.state !== 'awaiting_approval') {
      throw new ApiError(400, 'INVALID_TASK_STATE', `Task ${taskId} is not awaiting approval (state: ${task.state}).`);
    }

    return this.transitionState(projectId, taskId, ownerId, 'completed', {
      outputPayload: { approved: true, approvedAt: new Date().toISOString() },
    });
  }

  async completeManualHandoff(
    projectId: string,
    taskId: string,
    ownerId: string,
    assetData: {
      filePath: string;
      mimeType: string;
      durationSeconds: number;
      checksum: string;
      width?: number;
      height?: number;
    },
  ): Promise<{ task: ProductionTask; asset: Asset }> {
    const task = await this.models.Task.findOne({ projectId, taskId, ownerId });
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${taskId} not found.`);

    if (task.state !== 'awaiting_external_action' && task.mode !== 'manual_handoff') {
      throw new ApiError(400, 'INVALID_TASK_STATE', `Task ${taskId} is not awaiting manual handoff action.`);
    }

    // Create asset metadata record
    const assetDoc = await this.models.Asset.create({
      ownerId,
      projectId,
      sceneId: task.sceneId || null,
      taskId: task.taskId,
      provider: task.providerId || 'manual_handoff',
      type: task.type === 'VIDEO_GENERATION' ? 'video' : task.type === 'AUDIO_NARRATION' ? 'audio' : 'image',
      filePath: assetData.filePath,
      mimeType: assetData.mimeType,
      durationSeconds: assetData.durationSeconds,
      width: assetData.width,
      height: assetData.height,
      checksum: assetData.checksum,
      isValidated: false,
    });

    const updatedTask = await this.transitionState(projectId, taskId, ownerId, 'completed', {
      outputPayload: {
        assetId: assetDoc._id.toString(),
        filePath: assetData.filePath,
        durationSeconds: assetData.durationSeconds,
      },
    });

    const serializedAsset: Asset = {
      id: assetDoc._id.toString(),
      projectId,
      sceneId: assetDoc.sceneId || undefined,
      taskId: assetDoc.taskId,
      provider: assetDoc.provider,
      type: assetDoc.type as any,
      filePath: assetDoc.filePath,
      mimeType: assetDoc.mimeType,
      durationSeconds: assetDoc.durationSeconds,
      width: assetDoc.width || undefined,
      height: assetDoc.height || undefined,
      checksum: assetDoc.checksum,
      isValidated: assetDoc.isValidated,
      createdAt: assetDoc.createdAt.toISOString(),
    };

    return { task: updatedTask, asset: serializedAsset };
  }

  async handleTaskFailure(projectId: string, taskId: string, ownerId: string, error: string): Promise<ProductionTask> {
    const task = await this.models.Task.findOne({ projectId, taskId, ownerId });
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${taskId} not found.`);

    task.attempts += 1;
    task.error = error;

    if (task.attempts < task.maxAttempts) {
      task.state = 'retry_scheduled';
      await task.save();

      // Log event
      await this.models.ProductionEvent.create({
        ownerId,
        projectId,
        taskId,
        eventType: 'TASK_RETRY_SCHEDULED',
        newState: 'retry_scheduled',
        details: { attempts: task.attempts, maxAttempts: task.maxAttempts, error },
      });

      // Advance back to ready
      task.state = 'ready';
      await task.save();
    } else {
      task.state = 'failed';
      await task.save();

      // Log failure event
      await this.models.ProductionEvent.create({
        ownerId,
        projectId,
        taskId,
        eventType: 'TASK_FAILED_PERMANENTLY',
        newState: 'failed',
        details: { attempts: task.attempts, maxAttempts: task.maxAttempts, error },
      });

      // Block all downstream dependent tasks
      await this.blockDownstreamTasks(projectId, taskId, ownerId);
    }

    return this.serializeTask(task);
  }

  async invalidateAndRegenerate(projectId: string, targetTaskId: string, ownerId: string): Promise<ProductionTask[]> {
    const allTasks = await this.getTasksForProject(projectId, ownerId);
    const dag = new DirectedAcyclicGraph(allTasks);

    const target = dag.getTask(targetTaskId);
    if (!target) {
      throw new ApiError(404, 'TASK_NOT_FOUND', `Task ${targetTaskId} not found.`);
    }

    const downstreamIds = dag.getDownstreamDependentTaskIds(targetTaskId);

    // Reset target task to ready or awaiting_external_action
    const targetState = target.mode === 'manual_handoff' ? 'awaiting_external_action' : 'ready';
    await this.models.Task.updateOne(
      { projectId, taskId: targetTaskId, ownerId },
      {
        state: targetState,
        attempts: 0,
        error: null,
        outputPayload: null,
        completedAt: null,
      },
    );

    // Reset all downstream tasks to pending
    if (downstreamIds.size > 0) {
      await this.models.Task.updateMany(
        { projectId, taskId: { $in: Array.from(downstreamIds) }, ownerId },
        {
          state: 'pending',
          error: null,
          outputPayload: null,
          completedAt: null,
        },
      );
    }

    // Log regeneration audit event
    await this.models.ProductionEvent.create({
      ownerId,
      projectId,
      taskId: targetTaskId,
      eventType: 'PARTIAL_REGENERATION_INITIATED',
      details: { targetTaskId, invalidatedDownstreamTaskIds: Array.from(downstreamIds) },
    });

    return this.getTasksForProject(projectId, ownerId);
  }

  private async evaluateAndAdvanceDownstreamTasks(projectId: string, ownerId: string): Promise<void> {
    const allTasks = await this.getTasksForProject(projectId, ownerId);
    const dag = new DirectedAcyclicGraph(allTasks);
    const readyTasks = dag.getEligibleReadyTasks();

    for (const readyTask of readyTasks) {
      const nextState: TaskState = readyTask.mode === 'manual_handoff' ? 'awaiting_external_action' : 'ready';
      await this.models.Task.updateOne(
        { projectId, taskId: readyTask.id, ownerId },
        { state: nextState },
      );

      await this.models.ProductionEvent.create({
        ownerId,
        projectId,
        taskId: readyTask.id,
        eventType: 'TASK_UNLOCKED_READY',
        previousState: 'pending',
        newState: nextState,
      });
    }
  }

  private async blockDownstreamTasks(projectId: string, failedTaskId: string, ownerId: string): Promise<void> {
    const allTasks = await this.getTasksForProject(projectId, ownerId);
    const dag = new DirectedAcyclicGraph(allTasks);
    const downstreamIds = dag.getDownstreamDependentTaskIds(failedTaskId);

    if (downstreamIds.size > 0) {
      await this.models.Task.updateMany(
        { projectId, taskId: { $in: Array.from(downstreamIds) }, ownerId },
        { state: 'blocked', error: `Blocked by failed upstream prerequisite task ${failedTaskId}.` },
      );
    }
  }

  private serializeTask(doc: any): ProductionTask {
    return {
      id: doc.taskId,
      projectId: doc.projectId.toString(),
      sceneId: doc.sceneId || undefined,
      type: doc.type,
      name: doc.name,
      state: doc.state,
      prerequisiteTaskIds: doc.prerequisiteTaskIds || [],
      providerId: doc.providerId || undefined,
      mode: doc.mode,
      inputPayload: doc.inputPayload || {},
      outputPayload: doc.outputPayload || undefined,
      idempotencyKey: doc.idempotencyKey,
      attempts: doc.attempts,
      maxAttempts: doc.maxAttempts,
      error: doc.error || undefined,
      manualHandoffSpec: doc.manualHandoffSpec || undefined,
      externalJobId: doc.externalJobId || undefined,
      startedAt: doc.startedAt ? doc.startedAt.toISOString() : undefined,
      completedAt: doc.completedAt ? doc.completedAt.toISOString() : undefined,
    };
  }
}
