# CreatorFlow AI — Master Architecture Rules
## LLM-Powered Universal Video Production Orchestration Platform

CreatorFlow AI is an **LLM-powered production orchestration platform, NOT an AI media generation engine**.
We do not build custom generative video models, image models, TTS models, or custom 3D animation engines.
We integrate existing external AI services, coordinate their asynchronous workflows, validate outputs, and assemble media using FFmpeg.

- **Universal Orchestration**: Support any video category (documentaries, educational explainers, product ads, animated stories, tutorials, Shorts, Reels) across formats (`9:16`, `16:9`, `1:1`). Do not hardcode subjects, durations, or categories.
- **Persistent Workflow Engine (DAG)**: All production activities are modeled as a dependency-aware Directed Acyclic Graph of tasks.
  - Task states: `pending`, `ready`, `queued`, `running`, `awaiting_external_action`, `awaiting_approval`, `completed`, `failed`, `retry_scheduled`, `blocked`, `cancelled`, `skipped`.
  - Independent tasks execute concurrently; dependent tasks wait for prerequisite completion.
  - Every state transition must be persisted to MongoDB.
  - Idempotency keys must be enforced for all task executions.
  - Handle worker and server restarts gracefully without losing workflow state.
- **Two Provider Integration Modes**:
  1. **API Mode**: For providers with verified programmatic APIs (e.g. Gemini, ElevenLabs, Luma).
  2. **Manual Handoff Mode**: For external creative tools without public APIs (e.g. Google Flow, Runway, Midjourney). The orchestrator generates production-ready prompts and parameter instructions, marks tasks as `awaiting_external_action`, accepts user-provided media files, validates them with FFprobe, and automatically advances downstream DAG tasks. Never use unofficial web scraping or undocumented APIs.
- **Intelligent Provider Routing**: Deterministic eligibility checks (capabilities, free-tier status, quota, cost, aspect ratio) before recommending providers.
- **Free-First Policy**: Default budget is zero. Never automatically charge users or fall back to paid models without explicit approval. Quotas must be tracked and respected.
- **Media Assembly (Not Generation)**: The assembly system uses FFmpeg/FFprobe to validate external assets, synchronize audio and subtitles, apply transitions, mix background audio, and export normalized MP4s. Never represent placeholder media as completed production.
- **Deterministic Quality Assurance**: Deterministic QA checks for missing clips, silent audio, corrupted files, wrong aspect ratios, and missing subtitles before marking production complete.
- **Partial Scene Regeneration**: Support invalidating and regenerating single affected assets (e.g. regenerating scene 3 video while preserving approved audio and other scenes).
- **Workspace Hygiene**:
  - Build shared types first: `npm run build -w @creatorflow/shared`.
  - Run `npm run typecheck`, `npm test`, and `npm run build` after relevant changes.
  - Keep credentials server-side; never commit API keys or expose them to clients.
  - Integration tests must use real isolated MongoDB databases.
