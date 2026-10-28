# Progress & Architecture Status

Updated: 2026-10-28 (Asia/Kolkata).

## Current Milestone: Automated Post-Production & Universal Video Orchestration

CreatorFlow AI operates strictly as an **LLM-Powered Universal Video Production Orchestration Platform**.
We do not build custom generative video models, image models, TTS models, or custom 3D animation engines; we integrate external AI services and orchestrate their complete production lifecycle.

### Core Automation Architectural Mandate
Google Flow video generation operates via **Manual Handoff Mode** in Release 1.
**Every supported production stage after the user imports the generated video clips operates completely automatically, through final technical verification and delivery.**

The user is not required to manually merge clips, synchronize narration, create subtitles, process audio, encode the output, or perform routine technical QA.

---

## Implemented Architecture Layers

### 1. Manual Google Flow Handoff Mode
- Scene-by-scene prompt generator producing production-ready, cinematic 8k prompts.
- Displays target duration, visual style, aspect ratio (9:16, 16:9, 1:1), and camera motion.
- One-click prompt copying and direct link to [Google Flow](https://labs.google/flow).
- Ingestion endpoint validates user-provided MP4 files via FFprobe before marking tasks complete.
- **Hands-Off Trigger**: Ingesting the final required clip automatically triggers the downstream post-production pipeline without requiring any manual button press.

### 2. Automated Narration Production (TTS)
- Configurable TTS engine supporting ElevenLabs API and a zero-budget `LocalSpeechSynthesizer` fallback.
- Natural speech duration calculation based on language cadence (~140 WPM English, ~115 WPM Hindi).
- Synthesizes broadcast-compliant, loudness-normalized (`-16 LUFS`) audio.
- Audio tasks run concurrently with video generation in the DAG.
- Audio assets are reused when narration script text is unchanged.

### 3. Automated Media Ingestion & Technical Validation
- FFprobe inspection verifies video container, stream presence, codec (`H.264 / AVC`), target aspect ratio, and duration tolerance.
- Rejects corrupt or invalid media files with descriptive error diagnostics (HTTP 422).
- Preserves original source assets intact in persistent storage.

### 4. Intelligent Synchronization Engine
- `TimelineSynchronizer` evaluates video duration against narration audio for every scene.
- Enforces bounded correction policies:
  - Direct sync when drift is ≤ 0.3s.
  - Video trimming when video exceeds audio.
  - Bounded speed adjustments (0.85x - 1.15x) for minor drift.
  - End-frame holds (`tpad=stop_mode=clone`) for shorter video clips.
- Generates deterministic `TimelineManifest`.

### 5. Automatic Subtitle Generation
- `SubtitleGenerator` segments narration into timed sentence chunks.
- Emits standard `.srt` subtitle manifests with millisecond timestamp precision.
- Supports Hindi Unicode (Devanagari) and English text.
- Burns subtitles directly into video with safe-area margins and high-contrast typography.

### 6. Automatic Video Assembly (FFmpeg)
- `TimelineAssembler` executes normalized multitrack rendering:
  - Formats every scene to target aspect ratio (1080x1920 for 9:16, 1920x1080 for 16:9, 1080x1080 for 1:1) with SAR=1 and 30fps.
  - Orders scenes sequentially and synchronizes narration audio per scene.
  - Applies loudness normalization (`loudnorm=I=-16:TP=-1.5:LRA=11`).
  - Burns subtitles using FFmpeg `subtitles` filter with `libass`.
  - Encodes final master MP4 (H.264 + AAC).
  - Automatically triggers downstream QA inspection.

### 7. Automated Quality Verification (QA Engine)
- Deterministic technical inspection:
  - File presence and size integrity (>10KB).
  - FFprobe stream validation (H.264 video + AAC audio).
  - Aspect ratio and resolution verification against project specification.
  - Audio silence detection (`mean_volume > -65dB`).
  - Timeline duration conformance against synchronized manifest (±2.5s tolerance).
  - Asset and DAG task completeness check.
- Categorizes outcome: `PASSED`, `PASSED_WITH_WARNINGS`, `REQUIRES_REVIEW`, `FAILED`.
- Automatically marks project `COMPLETED` when QA passes.

### 8. Failure-Aware Workflow & Crash Recovery
- Partial scene invalidation: invalidating Scene 2 video preserves Scene 1 and Scene 3 video assets and all narration audio, re-scheduling only the affected tasks.
- `recoverInFlightTasks`: automatically recovers in-flight running tasks interrupted by worker or server restarts.

### 9. User Interface
- **Storyboard Workspace**: Displays Google Flow prompts, copy buttons, direct links, and clip ingestion inputs with FFprobe validation feedback.
- **Automated Workflow Dashboard**: Real-time DAG task states, final master video player preview, download controls, QA inspection breakdown, and partial scene regeneration controls.

---

## Test Verification

| Test Suite | Total Tests | Status |
| --- | --- | --- |
| `tests/project-schema.test.ts` | 14 tests | Passed |
| `tests/script-and-scene-schema.test.ts` | 7 tests | Passed |
| `apps/api/test/config.test.ts` | 3 tests | Passed |
| `apps/api/test/api.test.ts` | 15 tests | Passed |
| `apps/api/test/production.test.ts` | 5 tests | Passed |
| `apps/api/test/automated-post-production.test.ts` | 2 tests | Passed |
| `apps/web/src/components.test.tsx` | 5 tests | Passed |
| `apps/web/src/ProjectForm.test.tsx` | 4 tests | Passed |
| **Total** | **55 tests across 8 suites** | **100% Passed** |
