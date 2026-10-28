import type { ProductionTask, TaskState } from '@creatorflow/shared';

export interface DAGValidationResult {
  isValid: boolean;
  cycles?: string[][];
  missingPrerequisites?: { taskId: string; missingId: string }[];
}

export class DirectedAcyclicGraph {
  private tasks = new Map<string, ProductionTask>();
  private adjacency = new Map<string, Set<string>>(); // taskId -> Set of dependent taskIds
  private reverseAdjacency = new Map<string, Set<string>>(); // taskId -> Set of prerequisite taskIds

  constructor(tasks: ProductionTask[] = []) {
    for (const task of tasks) {
      this.addTask(task);
    }
  }

  addTask(task: ProductionTask): void {
    this.tasks.set(task.id, task);
    if (!this.adjacency.has(task.id)) {
      this.adjacency.set(task.id, new Set());
    }
    if (!this.reverseAdjacency.has(task.id)) {
      this.reverseAdjacency.set(task.id, new Set());
    }

    for (const prereqId of task.prerequisiteTaskIds) {
      if (!this.adjacency.has(prereqId)) {
        this.adjacency.set(prereqId, new Set());
      }
      this.adjacency.get(prereqId)!.add(task.id);
      this.reverseAdjacency.get(task.id)!.add(prereqId);
    }
  }

  getTask(id: string): ProductionTask | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): ProductionTask[] {
    return Array.from(this.tasks.values());
  }

  validate(): DAGValidationResult {
    const missing: { taskId: string; missingId: string }[] = [];
    for (const task of this.tasks.values()) {
      for (const prereqId of task.prerequisiteTaskIds) {
        if (!this.tasks.has(prereqId)) {
          missing.push({ taskId: task.id, missingId: prereqId });
        }
      }
    }

    // Cycle detection using Kahn's algorithm or DFS
    const inDegree = new Map<string, number>();
    for (const taskId of this.tasks.keys()) {
      inDegree.set(taskId, this.reverseAdjacency.get(taskId)?.size || 0);
    }

    const queue: string[] = [];
    for (const [taskId, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(taskId);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      visitedCount++;
      for (const neighbor of this.adjacency.get(curr) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    const hasCycle = visitedCount !== this.tasks.size;
    return {
      isValid: !hasCycle && missing.length === 0,
      missingPrerequisites: missing.length > 0 ? missing : undefined,
    };
  }

  topologicalSort(): ProductionTask[] {
    const inDegree = new Map<string, number>();
    for (const taskId of this.tasks.keys()) {
      inDegree.set(taskId, this.reverseAdjacency.get(taskId)?.size || 0);
    }

    const queue: string[] = [];
    for (const [taskId, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(taskId);
    }

    const sorted: ProductionTask[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      sorted.push(this.tasks.get(curr)!);
      for (const neighbor of this.adjacency.get(curr) || []) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    if (sorted.length !== this.tasks.size) {
      throw new Error('Cannot sort graph with cycles.');
    }
    return sorted;
  }

  /**
   * Computes which tasks are eligible to transition from `pending` to `ready`.
   * A task is ready when:
   * 1. Its current state is `pending`
   * 2. ALL of its prerequisite tasks have completed successfully (`state === 'completed'`)
   */
  getEligibleReadyTasks(): ProductionTask[] {
    const ready: ProductionTask[] = [];
    for (const task of this.tasks.values()) {
      if (task.state !== 'pending') continue;

      const allPrereqsCompleted = task.prerequisiteTaskIds.every((prereqId) => {
        const prereq = this.tasks.get(prereqId);
        return prereq && prereq.state === 'completed';
      });

      if (allPrereqsCompleted) {
        ready.push(task);
      }
    }
    return ready;
  }

  /**
   * Identifies all downstream dependent tasks of a given task (recursively).
   * Used for selective invalidation and partial scene regeneration.
   */
  getDownstreamDependentTaskIds(taskId: string): Set<string> {
    const downstream = new Set<string>();
    const stack = [taskId];

    while (stack.length > 0) {
      const curr = stack.pop()!;
      const dependents = this.adjacency.get(curr) || [];
      for (const depId of dependents) {
        if (!downstream.has(depId)) {
          downstream.add(depId);
          stack.push(depId);
        }
      }
    }

    return downstream;
  }
}

