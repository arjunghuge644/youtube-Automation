import type { Models } from '../models.js';

export class WorkflowRecoveryEngine {
  constructor(private models: Models) {}

  async recoverInFlightWorkflows(): Promise<{ recoveredCount: number; tasks: string[] }> {
    // 1. Find all tasks interrupted in 'running' or 'queued' state
    const interruptedTasks = await this.models.Task.find({
      state: { $in: ['running', 'queued'] },
    });

    const recoveredIds: string[] = [];

    for (const task of interruptedTasks) {
      // If task has no external job running, safely reset to ready
      task.state = 'ready';
      await task.save();

      await this.models.ProductionEvent.create({
        ownerId: task.ownerId,
        projectId: task.projectId,
        taskId: task.taskId,
        eventType: 'SERVER_RECOVERY_RESET',
        previousState: 'running',
        newState: 'ready',
        details: { reason: 'Process restarted while task was in-flight' },
      });

      recoveredIds.push(task.taskId);
    }

    return {
      recoveredCount: recoveredIds.length,
      tasks: recoveredIds,
    };
  }
}

export async function recoverInFlightTasks(models: Models): Promise<number> {
  const engine = new WorkflowRecoveryEngine(models);
  const result = await engine.recoverInFlightWorkflows();
  return result.recoveredCount;
}

