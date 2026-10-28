# CreatorFlow AI — Workflow Engine & DAG Specification

## 1. Overview

The Workflow Engine is the core orchestration backbone of CreatorFlow AI. It models every video project as an executable, persistent Directed Acyclic Graph (DAG) of discrete tasks.

The engine coordinates asynchronous distributed execution, enforces prerequisites, enables maximum parallel concurrency, handles human-in-the-loop checkpoints, manages manual provider handoffs, and ensures crash resilience.

---

## 2. Task State Machine

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> ready: All prerequisites completed
    pending --> blocked: Prerequisite permanently failed
    ready --> queued: Dispatched to worker queue
    queued --> running: Worker claims execution
    running --> awaiting_external_action: Manual handoff required (e.g. Google Flow)
    running --> awaiting_approval: Human review required (e.g. Script Review)
    running --> completed: Success (asset generated/validated)
    running --> failed: Error occurred
    awaiting_external_action --> running: User uploads asset for validation
    awaiting_approval --> ready: Approved by user
    awaiting_approval --> pending: Rejected / edit requested
    failed --> retry_scheduled: Auto-retry backoff eligible
    retry_scheduled --> ready: Backoff timer expired
    failed --> blocked: Max retries exceeded
    running --> cancelled: User cancels project/stage
    pending --> skipped: Upstream task skipped or branch omitted
```

### State Definitions

| State | Meaning |
| --- | --- |
| `pending` | Task is waiting for one or more prerequisite tasks to complete successfully. |
| `ready` | All upstream dependencies are met; task is eligible for scheduling. |
| `queued` | Task has been pushed to the BullMQ processing queue. |
| `running` | Worker is actively executing the task. |
| `awaiting_external_action` | Generation must occur in an external UI (e.g. Google Flow). Waiting for user asset upload. |
| `awaiting_approval` | Requires explicit user sign-off (e.g. script approval, final video review). |
| `completed` | Task finished successfully and output metadata/assets are persisted. |
| `failed` | Execution threw an unhandled error or validation rejected the output. |
| `retry_scheduled` | Transient failure detected; waiting for exponential backoff before transitioning to `ready`. |
| `blocked` | An upstream dependency failed permanently or required provider quota is exhausted. |
| `cancelled` | Task was intentionally aborted by the user or an enclosing pipeline cancellation. |
| `skipped` | Task was bypassed because an optional feature or conditional branch was omitted. |

---

## 3. Standard Production DAG Topology

```mermaid
graph TD
    T0["Task: Creative Planning (Script Generation)"]
    T1["Task: Human Script Approval"]
    T2["Task: Storyboard & Prompt Compilation"]
    
    subgraph ParallelGen["Parallel Generation Stage"]
        T_V1["Task: Video Gen (Scene 1)"]
        T_V2["Task: Video Gen (Scene 2)"]
        T_V3["Task: Video Gen (Scene 3)"]
        T_A1["Task: TTS Narration (Scene 1)"]
        T_A2["Task: TTS Narration (Scene 2)"]
        T_A3["Task: TTS Narration (Scene 3)"]
        T_M["Task: Background Music Selection"]
    end
    
    subgraph IngestAndQA["Asset Ingestion & Validation"]
        T_QA_V1["Task: FFprobe QA (Scene 1 Video)"]
        T_QA_V2["Task: FFprobe QA (Scene 2 Video)"]
        T_QA_V3["Task: FFprobe QA (Scene 3 Video)"]
        T_QA_A["Task: Audio Normalization & Alignment"]
    end
    
    T_SYNC["Task: Timeline Synchronization & Assembly"]
    T_FINAL_QA["Task: Deterministic Quality Verification"]
    T_EXPORT["Task: MP4 Delivery & Publishing"]

    T0 --> T1
    T1 --> T2
    T2 --> T_V1 & T_V2 & T_V3 & T_A1 & T_A2 & T_A3 & T_M
    T_V1 --> T_QA_V1
    T_V2 --> T_QA_V2
    T_V3 --> T_QA_V3
    T_A1 & T_A2 & T_A3 --> T_QA_A
    T_QA_V1 & T_QA_V2 & T_QA_V3 & T_QA_A & T_M --> T_SYNC
    T_SYNC --> T_FINAL_QA
    T_FINAL_QA --> T_EXPORT
```

---

## 4. Key Orchestration Guarantees

### 1. Concurrency & Non-Blocking Execution
- Independent tasks run in parallel. A video generation task for Scene 1 never blocks an audio generation task for Scene 2.
- A task transitions to `ready` as soon as all prerequisite tasks report `completed`.

### 2. Idempotency Keys
- Each task computes a deterministic idempotency key based on:
  `hash(projectId + taskId + inputPayloadHash + attemptCount)`
- Prevents double-submission to external paid or quota-limited APIs.

### 3. Worker Restart & Crash Recovery
- On backend startup, the engine queries for tasks stuck in `running` or `queued`.
- In-flight tasks with external job IDs are polled to check if the third-party job finished while the server was restarting.
- Tasks without external job references are safely reset to `ready` to re-enter the queue.

### 4. Selective Partial Regeneration
- If a user rejects Scene 2's video:
  1. Only Scene 2's video task and downstream tasks (Scene 2 QA, Assembly, Final QA) are invalidated.
  2. Scene 1 and Scene 3 video assets, plus all approved narration tracks, remain completely preserved.
  3. No unnecessary external provider calls are made.

