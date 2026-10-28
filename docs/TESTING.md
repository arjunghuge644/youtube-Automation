# Testing

Run from the repository root after installing dependencies:

```bash
npm run build
npm run typecheck
npm test
```

See [PROGRESS.md](PROGRESS.md) for the latest executed commands and results. A command listed here is a supported verification path, not an assertion that it passed in every environment.

## Test layers

- Shared contract tests check valid defaults, invalid bounds/enums, unknown fields, and update preconditions.
- API tests use Supertest against the app factory and a real isolated MongoDB instance. They cover registration/login, session behavior, CSRF, validated project creation/listing/editing/deletion, ownership, and version conflicts.
- Web tests cover meaningful account/project form behavior and errors where implemented.
- A local browser smoke test should register, create/edit a project, refresh, log out, and log back in. Another account must not see the first account's projects.

No test performs paid AI calls or publishes externally. Rendering, animation determinism, narration timing, subtitle timing, and media integrity tests belong to subsequent implemented phases; a foundation build does not prove video generation.

## Real MongoDB integration dependency

The integration harness uses `mongodb-memory-server`, which launches an actual `mongod` in an isolated test database. It is not an in-memory JavaScript replacement. The first run may download a MongoDB binary from MongoDB's distribution service and requires a compatible platform and network access.

For an existing supported binary:

```bash
MONGOMS_SYSTEM_BINARY=/absolute/path/to/mongod npm test
```

Use a compatible Linux distribution override only when the binary's native dependencies are installed; do not assume an Ubuntu binary will run on every Linux host. Keep test data isolated from normal development and production databases. Tests must clean up the temporary server after completion.

## Infrastructure checks

With Docker available:

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
curl --fail http://localhost:8080/health/live
curl --fail http://localhost:8080/health/ready
```

MongoDB and Redis health checks must both pass before the full container stack becomes ready. Stop one service and verify readiness reports failure rather than a fabricated healthy status. Container startup and native local startup are distinct checks.

## Manual acceptance checks

1. Create a new account and an empty project list appears.
2. Create a valid Hindi, vertical, 60-second project; it appears as a draft.
3. Edit its settings, refresh, and confirm persistence.
4. Submit stale `expectedVersion` and confirm a conflict instead of silently overwriting data.
5. Sign in as a second account; the first account's list and direct project URL remain inaccessible.
6. Check mobile layout, keyboard focus, form errors, loading states, and API-unavailable handling.
7. Confirm no generated video, active render, completed output, or download is claimed for a draft.

Technical checks establish these behaviors only. They do not certify production readiness, perceptual media quality, or a completed video MVP.
