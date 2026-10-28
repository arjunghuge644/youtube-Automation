import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose, { type Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createModels, initializeIndexes, type Models } from '../src/models.js';
import { recoverInFlightTasks } from '../src/orchestration/recovery.js';

const execFileAsync = promisify(execFile);
const config = loadConfig({ NODE_ENV: 'test' });

describe('Automated Post-Production & Workflow Orchestration Pipeline', () => {
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let models: Models;
  let app: ReturnType<typeof createApp>;
  let tempDir: string;
  let validClip1Path: string;
  let validClip2Path: string;
  let validClip3Path: string;
  let invalidAspectClipPath: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongo.getUri(), { serverSelectionTimeoutMS: 5000 }).asPromise();
    models = createModels(connection);
    await initializeIndexes(models);

    // Create synthetic test video clips using FFmpeg
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cf-test-clips-'));
    validClip1Path = path.join(tempDir, 'valid_scene1.mp4');
    validClip2Path = path.join(tempDir, 'valid_scene2.mp4');
    validClip3Path = path.join(tempDir, 'valid_scene3.mp4');
    invalidAspectClipPath = path.join(tempDir, 'invalid_aspect.mp4');

    // Create 3 valid 9:16 (1080x1920) 5.0-second H.264 clips with silent audio
    const createClip = async (outPath: string, color: string) => {
      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'lavfi',
        '-i', `color=c=${color}:s=1080x1920:d=5.0:r=30`,
        '-f', 'lavfi',
        '-i', 'aevalsrc=0:d=5.0:s=44100',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
        outPath,
      ]);
    };

    await Promise.all([
      createClip(validClip1Path, 'blue'),
      createClip(validClip2Path, 'green'),
      createClip(validClip3Path, 'red'),
      // Invalid 16:9 clip (1920x1080)
      execFileAsync('ffmpeg', [
        '-y',
        '-f', 'lavfi',
        '-i', 'color=c=yellow:s=1920x1080:d=5.0:r=30',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        invalidAspectClipPath,
      ]),
    ]);
  }, 40_000);

  beforeEach(async () => {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
    app = createApp({ connection, config, models, redisHealth: async () => true });
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    await connection?.close();
    await mongo?.stop();
  });

  async function registerUser(email = 'creator@example.com') {
    const agent = request.agent(app);
    const response = await agent
      .post('/api/v1/auth/register')
      .send({ name: 'Creator', email, password: 'SuperSecurePassword2026!' })
      .expect(201);
    return { agent, csrf: response.body.data.csrfToken as string, user: response.body.data.user };
  }

  it('Release 1 Acceptance Test: Hands-Off Automated Post-Production Pipeline', async () => {
    const user = await registerUser('postprod@example.com');

    // 1. Create a 3-scene vertical documentary project
    const projectRes = await user.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', user.csrf)
      .send({
        title: 'Deep Ocean Wonders',
        prompt: 'Create a vertical documentary about living coral reefs and sea turtles in the deep ocean.',
        category: 'documentary',
        language: 'en',
        durationSeconds: 15,
        aspectRatio: '9:16',
        visualStyle: 'cinematic',
        narrationStyle: 'documentary',
        narrationEnabled: true,
        audience: 'Nature lovers',
        resolution: '1080p',
      })
      .expect(201);

    const projectId = projectRes.body.data.id;

    // 2. Generate and approve Script
    await user.agent
      .post(`/api/v1/projects/${projectId}/script/generate`)
      .set('X-CSRF-Token', user.csrf)
      .expect(202);

    const scriptRes = await user.agent
      .get(`/api/v1/projects/${projectId}/script`)
      .expect(200);
    expect(scriptRes.body.data.scenes.length).toBe(3);

    await user.agent
      .post(`/api/v1/projects/${projectId}/script/approve`)
      .set('X-CSRF-Token', user.csrf)
      .expect(200);

    // 3. Generate Storyboard with Google Flow prompts & compile DAG
    const storyboardRes = await user.agent
      .post(`/api/v1/projects/${projectId}/storyboard/generate`)
      .set('X-CSRF-Token', user.csrf)
      .expect(201);

    const storyboard = storyboardRes.body.data;
    expect(storyboard.scenes.length).toBe(3);
    expect(storyboard.scenes[0].suggestedProvider).toBe('google_flow');
    expect(storyboard.scenes[0].providerPrompt).toContain('8k resolution');

    // 4. Verify initial DAG task states
    const tasksRes = await user.agent
      .get(`/api/v1/projects/${projectId}/tasks`)
      .expect(200);

    const tasks = tasksRes.body.data;
    expect(tasks.length).toBeGreaterThanOrEqual(10);

    const video1Task = tasks.find((t: any) => t.id === 'task_video_scene_1');
    const video2Task = tasks.find((t: any) => t.id === 'task_video_scene_2');
    const video3Task = tasks.find((t: any) => t.id === 'task_video_scene_3');
    expect(video1Task.state).toBe('awaiting_external_action');
    expect(video2Task.state).toBe('awaiting_external_action');
    expect(video3Task.state).toBe('awaiting_external_action');
    expect(video1Task.manualHandoffSpec).toBeDefined();
    expect(video1Task.manualHandoffSpec.providerUrl).toBe('https://labs.google/flow');

    // 5. Technical Validation Failure: Reject clip with wrong aspect ratio
    const rejectRes = await user.agent
      .post(`/api/v1/projects/${projectId}/tasks/task_video_scene_1/handoff-complete`)
      .set('X-CSRF-Token', user.csrf)
      .send({ filePath: invalidAspectClipPath })
      .expect(422);

    expect(rejectRes.body.error.code).toBe('VALIDATION_FAILED');
    expect(rejectRes.body.error.message).toContain('Aspect ratio mismatch');

    // Re-check Scene 1 task: marked failed, but other tasks remain awaiting_external_action
    const tasksAfterFail = await user.agent.get(`/api/v1/projects/${projectId}/tasks`).expect(200);
    const failedTask = tasksAfterFail.body.data.find((t: any) => t.id === 'task_video_scene_1');
    expect(failedTask.state).toBe('failed');
    const unaffectedTask = tasksAfterFail.body.data.find((t: any) => t.id === 'task_video_scene_2');
    expect(unaffectedTask.state).toBe('awaiting_external_action');

    // Reset Scene 1 task back to awaiting_external_action
    await models.Task.updateOne({ projectId, taskId: 'task_video_scene_1' }, { state: 'awaiting_external_action', error: null });

    // 6. Ingest Valid Clip 1
    const clip1Res = await user.agent
      .post(`/api/v1/projects/${projectId}/tasks/task_video_scene_1/handoff-complete`)
      .set('X-CSRF-Token', user.csrf)
      .send({ filePath: validClip1Path })
      .expect(200);

    expect(clip1Res.body.data.task.state).toBe('completed');
    expect(clip1Res.body.data.asset.isValidated).toBe(true);
    expect(clip1Res.body.data.autoProductionTriggered).toBe(false); // Waiting for clips 2 & 3

    // 7. Ingest Valid Clip 2
    const clip2Res = await user.agent
      .post(`/api/v1/projects/${projectId}/tasks/task_video_scene_2/handoff-complete`)
      .set('X-CSRF-Token', user.csrf)
      .send({ filePath: validClip2Path })
      .expect(200);

    expect(clip2Res.body.data.autoProductionTriggered).toBe(false); // Waiting for clip 3

    // 8. Ingest Valid Clip 3 -> AUTOMATIC POST-PRODUCTION TRIGGER!
    // The user does not press any button. Post-production executes automatically through delivery!
    const clip3Res = await user.agent
      .post(`/api/v1/projects/${projectId}/tasks/task_video_scene_3/handoff-complete`)
      .set('X-CSRF-Token', user.csrf)
      .send({ filePath: validClip3Path })
      .expect(200);

    expect(clip3Res.body.data.autoProductionTriggered).toBe(true);
    expect(clip3Res.body.data.qaResult).toBeDefined();
    if (!clip3Res.body.data.qaResult.passed) {
      console.error('QA FAILED CHECKS:', JSON.stringify(clip3Res.body.data.qaResult, null, 2));
    }
    expect(clip3Res.body.data.qaResult.passed).toBe(true);
    expect(clip3Res.body.data.qaResult.outcome).toBe('PASSED');
    expect(clip3Res.body.data.exportPath).toBeDefined();

    // 9. Verify Final Export Media on disk
    const exportPath = clip3Res.body.data.exportPath;
    const exportStats = await fs.stat(exportPath);
    expect(exportStats.size).toBeGreaterThan(10_000); // Valid MP4 file rendered

    // 10. Verify project status was automatically updated to COMPLETED
    const finalProjectRes = await user.agent.get(`/api/v1/projects/${projectId}`).expect(200);
    expect(finalProjectRes.body.data.status).toBe('COMPLETED');

    // 11. Verify QA Report endpoint
    const qaRes = await user.agent.get(`/api/v1/projects/${projectId}/qa`).expect(200);
    expect(qaRes.body.data.passed).toBe(true);
    expect(qaRes.body.data.checks.length).toBeGreaterThanOrEqual(5);

    // 12. Verify Assets List contains videos, audio narration, subtitles, and export
    const assetsRes = await user.agent.get(`/api/v1/projects/${projectId}/assets`).expect(200);
    const assetTypes = assetsRes.body.data.map((a: any) => a.type);
    expect(assetTypes).toContain('video');
    expect(assetTypes).toContain('audio');

    // 13. Test Partial Scene Regeneration:
    // Invalidate Scene 2 -> Resets only Scene 2 video and assembly, preserving Scene 1, Scene 3 and audio!
    const regenRes = await user.agent
      .post(`/api/v1/projects/${projectId}/regenerate-scene`)
      .set('X-CSRF-Token', user.csrf)
      .send({ sceneId: 'scene_2' })
      .expect(200);

    const postRegenTasks = regenRes.body.data;
    const regenScene2 = postRegenTasks.find((t: any) => t.id === 'task_video_scene_2');
    const preservedScene1 = postRegenTasks.find((t: any) => t.id === 'task_video_scene_1');
    const preservedScene3 = postRegenTasks.find((t: any) => t.id === 'task_video_scene_3');
    const invalidatedAssembly = postRegenTasks.find((t: any) => t.id === 'task_assembly');

    expect(regenScene2.state).toBe('awaiting_external_action');
    expect(preservedScene1.state).toBe('completed');
    expect(preservedScene3.state).toBe('completed');
    expect(invalidatedAssembly.state).toBe('pending');
  }, 60_000);

  it('verifies crash recovery resets in-flight running tasks to ready', async () => {
    const user = await registerUser('recovery@example.com');
    const projectRes = await user.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', user.csrf)
      .send({
        title: 'Recovery Test',
        prompt: 'Space exploration history documentary',
        category: 'documentary',
        language: 'en',
        durationSeconds: 15,
        aspectRatio: '16:9',
      })
      .expect(201);

    const projectId = projectRes.body.data.id;

    // Simulate an in-flight task that was running when the worker or server restarted
    await models.Task.create({
      ownerId: user.user.id,
      projectId,
      taskId: 'task_running_interrupted',
      type: 'TIMELINE_ASSEMBLY',
      name: 'Stitching intermediate scenes',
      state: 'running',
      idempotencyKey: 'key_interrupted_123',
      attempts: 1,
    });

    const resetCount = await recoverInFlightTasks(models);
    expect(resetCount).toBe(1);

    const recovered = await models.Task.findOne({ projectId, taskId: 'task_running_interrupted' });
    expect(recovered?.state).toBe('ready');
  });
});

