# REST API — Phase 1 & 2

Base path: `/api/v1`. JSON responses use `{ "data": ... }`; errors use `{ "error": { "code": "...", "message": "...", "details": ... } }`. `details` is optional. Passwords, session values, and connection secrets are never returned as diagnostics.

## Authentication

| Method and path | Request | Result |
| --- | --- | --- |
| `POST /auth/register` | `{ "name": "Creator", "email": "creator@example.com", "password": "a-long-unique-password" }` | Account, session cookie, and `{data: {user, csrfToken}}` |
| `POST /auth/login` | `{ "email": "creator@example.com", "password": "a-long-unique-password" }` | Session cookie and `{data: {user, csrfToken}}` |
| `GET /auth/me` | Session cookie | `{data: {user, csrfToken}}` |
| `POST /auth/logout` | Session cookie and CSRF header | `204`; current session revoked |

`user` contains only `id`, `name`, and `email`. The cookie name is `creatorflow_session`; it is HTTP-only and SameSite=Lax. Clients retain `csrfToken` in memory and send it as `X-CSRF-Token` on authenticated mutations. Reloading the browser retrieves the token with `/auth/me`. Requests with an Origin header must match `APP_ORIGIN`.

## Projects

All routes below require authentication. They enforce ownership on the server.

| Method and path | Behavior |
| --- | --- |
| `POST /projects` | Create an owned draft from validated settings |
| `GET /projects?page=1&pageSize=50` | List the current user's projects with pagination |
| `GET /projects/:id` | Fetch an owned project |
| `PATCH /projects/:id` | Edit allowed settings with `expectedVersion` |
| `DELETE /projects/:id` | Soft-delete an owned draft; return `204` |

## Production Pipeline (Phase 2)

All production endpoints require authentication and enforce server-side ownership. State-changing requests (`POST`, `PATCH`) require `X-CSRF-Token`.

| Method and path | Behavior |
| --- | --- |
| `GET /projects/:id/production` | Get current production state machine status, script/scene approvals, and active job |
| `POST /projects/:id/script/generate` | Dispatch async script generation job from `DRAFT`, `SCRIPT_REVIEW`, or `FAILED` |
| `GET /projects/:id/script` | Fetch the current structured script |
| `PATCH /projects/:id/script` | Edit script scenes with optimistic concurrency (`expectedVersion`) |
| `POST /projects/:id/script/approve` | Explicitly approve the script; locks script edits and unlocks scene planning |
| `POST /projects/:id/scenes/generate` | Dispatch async scene planning job using approved script and template rules |
| `GET /projects/:id/scenes` | Fetch the current bounded scene plan |
| `PATCH /projects/:id/scenes` | Edit camera, traffic density, speed, or subtitles with `expectedVersion` |
| `POST /projects/:id/scenes/approve` | Explicitly approve the scene plan; transitions project to `READY_TO_RENDER` |

### Script Payload Example

```json
{
  "expectedVersion": 1,
  "title": "ट्रैफिक जाम क्यों होता है?",
  "hook": "क्या आपने कभी सोचा है कि बिना किसी दुर्घटना के भी अचानक लंबा ट्रैफिक जाम क्यों लग जाता है?",
  "totalDurationSeconds": 60,
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "शुरुआत: सामान्य आवागमन",
      "narration": "कल्पना कीजिए, आप एक व्यस्त चौराहे की ओर सामान्य गति से आगे बढ़ रहे हैं...",
      "visualDescription": "Cinematic wide camera view of stylized 3D vehicles traveling across an urban multi-lane intersection.",
      "durationSeconds": 15
    }
  ]
}
```

### Scene Plan Structure (`traffic_intersection`)

```json
{
  "scenes": [
    {
      "id": "scene_1",
      "sceneNumber": 1,
      "template": "traffic_intersection",
      "durationSeconds": 15,
      "narration": {
        "text": "कल्पना कीजिए...",
        "language": "hi"
      },
      "subtitles": [
        { "text": "कल्पना कीजिए...", "startSeconds": 0, "endSeconds": 7.5 }
      ],
      "transition": "fade",
      "camera": { "type": "cinematic", "zoom": 1.1, "angleDegrees": 30 },
      "traffic": {
        "density": "moderate",
        "vehicleCount": 26,
        "averageSpeed": 48,
        "trafficSignalState": "green"
      },
      "deterministicSeed": 42001
    }
  ],
  "totalDurationSeconds": 60
}
```

## Health

- `GET /health/live`: process liveness; does not assert database availability.
- `GET /health/ready`: checks MongoDB and Redis, returning `503` while required infrastructure is unavailable.
