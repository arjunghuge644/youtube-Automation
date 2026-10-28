# CreatorFlow AI — Master Phased Implementation Plan

## Overview
CreatorFlow AI is an **LLM-powered universal video production orchestration platform**. It integrates existing AI services, manages a persistent dependency graph (DAG), validates external media via FFprobe, and assembles productions using FFmpeg.

---

## Phase 1: Foundation (Completed)
- [x] Typed npm workspaces monorepo (`packages/shared-types`, `apps/api`, `apps/web`).
- [x] Secure user authentication, salted scrypt password hashing, session rotation, and CSRF protection.
- [x] Real MongoDB persistence, project CRUD, version snapshots, and optimistic concurrency.
- [x] React Studio dashboard with dark design system and responsive form controls.
- [x] Universal project models supporting 8 video categories and 3 aspect ratios (`9:16`, `16:9`, `1:1`).

---

## Phase 2: LLM Production Intelligence (Current Focus)
- [x] Multi-category creative brief parsing.
- [ ] Implement structured Gemini SDK integration with strict JSON output schemas.
- [ ] Creative Director & Script Agent generating narrative structure, hooks, dialogue, and timed scene breakdowns.
- [ ] Storyboard Planner deconstructing scenes into detailed shots, camera configurations, lighting, and provider-optimized prompts.
- [ ] Schema validation for all LLM outputs with fallback to deterministic local templates when offline.

---

## Phase 3: Orchestration Engine & Persistent DAG
- [ ] Implement persistent Task and TaskDependency schemas in MongoDB.
- [ ] Complete DAG Compiler converting storyboard scenes into parallel & sequential tasks.
- [ ] Implement Task State Machine (`pending`, `ready`, `queued`, `running`, `awaiting_external_action`, `awaiting_approval`, `completed`, `failed`, `retry_scheduled`, `blocked`, `cancelled`, `skipped`).
- [ ] Concurrency-enabled Task Scheduler (evaluates ready tasks and dispatches to execution queues).
- [ ] Idempotency key computation to prevent duplicate provider job submissions.
- [ ] Worker crash recovery logic that restores in-flight state upon server restart.

---

## Phase 4: Provider Integration & Routing
- [ ] Provider Registry interface covering Video, Audio/TTS, Image, and LLM services.
- [ ] **Manual Handoff Mode**:
  - Generates copyable production prompts and instructions for services without public APIs (Google Flow, Runway, Midjourney).
  - Handles task status transitions to `awaiting_external_action`.
  - Ingests user-uploaded media files and triggers downstream DAG tasks.
- [ ] **API Mode**: Programmatic job submission and status polling for supported provider APIs.
- [ ] Deterministic Provider Router matching scene constraints, quotas, and free-first policies.

---

## Phase 5: Media Pipeline & Assembly
- [ ] Deterministic FFprobe validator checking container format, video codec (H.264), aspect ratio, duration tolerances, and audio streams.
- [ ] Multitrack timeline compiler assembling video tracks, narration tracks, background music, and text overlays.
- [ ] FFmpeg assembly engine applying scene transitions (`fade`, `cut`, `dissolve`), audio volume ducking, and subtitle burn-in.
- [ ] Normalized MP4 export service.

---

## Phase 6: Reliability & Acceptance Verification
- [ ] Deterministic QA Engine checking for missing clips, silent audio, corrupted files, and incomplete DAG nodes.
- [ ] Partial scene regeneration: re-rendering an individual rejected scene without repeating completed tasks.
- [ ] End-to-end acceptance tests across 3 project categories:
  1. Educational Explainer (Hindi narration, multi-scene).
  2. Cinematic Documentary (English narration, external media composition, lower thirds).
  3. Product Commercial (1:1 square ratio, motion graphics typography, music-led).
