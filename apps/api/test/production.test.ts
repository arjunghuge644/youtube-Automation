import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose, { type Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createModels, initializeIndexes, type Models } from '../src/models.js';

const config = loadConfig({ NODE_ENV: 'test' });

const hindiTrafficProject = {
  title: 'ट्रैफिक जाम क्यों होता है?',
  prompt: 'Explain traffic congestion with moving 3D vehicles, bottlenecks, and Hindi narration.',
  category: 'educational',
  language: 'hi',
  durationSeconds: 60,
  aspectRatio: '9:16',
  visualStyle: 'stylized_3d',
  narrationStyle: 'documentary',
  narrationEnabled: true,
  audience: 'General audience',
  resolution: '720p',
};

const documentaryProject = {
  title: 'The Great Barrier Reef',
  prompt: 'Create an engaging nature documentary about living coral reef ecosystems, marine life, and ocean preservation.',
  category: 'documentary',
  language: 'en',
  durationSeconds: 45,
  aspectRatio: '16:9',
  visualStyle: 'documentary_footage',
  narrationStyle: 'documentary',
  narrationEnabled: true,
  audience: 'Nature enthusiasts',
  resolution: '1080p',
};

const productPromoProject = {
  title: 'Aura Studio Headphones Launch',
  prompt: 'Commercial product promo advertisement highlighting titanium acoustic hardware, wireless silence, and limited release.',
  category: 'product_promo',
  language: 'en',
  durationSeconds: 30,
  aspectRatio: '9:16',
  visualStyle: 'motion_graphics',
  narrationStyle: 'energetic',
  narrationEnabled: false,
  audience: 'Music lovers',
  resolution: '1080p',
};

describe('Universal Video Platform Pipeline against real MongoDB', () => {
  let mongo: MongoMemoryServer;
  let connection: Connection;
  let models: Models;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    connection = await mongoose.createConnection(mongo.getUri(), { serverSelectionTimeoutMS: 5000 }).asPromise();
    models = createModels(connection);
    await initializeIndexes(models);
  });

  beforeEach(async () => {
    await Promise.all(Object.values(models).map((model) => model.deleteMany({})));
    app = createApp({ connection, config, models, redisHealth: async () => true });
  });

  afterAll(async () => {
    await connection?.close();
    await mongo?.stop();
  });

  async function register(email = 'director@example.com') {
    const agent = request.agent(app);
    const response = await agent
      .post('/api/v1/auth/register')
      .send({ name: 'Director', email, password: 'SuperSecurePassword2026!' })
      .expect(201);
    return { agent, csrf: response.body.data.csrfToken as string, user: response.body.data.user };
  }

  it('lists registered media engines with capability declarations', async () => {
    const res = await request(app).get('/api/v1/engines').expect(200);
    const engines = res.body.data;
    expect(engines.length).toBeGreaterThanOrEqual(3);

    const procedural = engines.find((e: any) => e.id === 'engine_procedural_3d');
    expect(procedural).toBeDefined();
    expect(procedural.isAvailable).toBe(true);
    expect(procedural.capabilities).toContain('procedural_3d');

    const mograph = engines.find((e: any) => e.id === 'engine_motion_graphics');
    expect(mograph).toBeDefined();
    expect(mograph.isAvailable).toBe(true);

    const composited = engines.find((e: any) => e.id === 'engine_composited_media');
    expect(composited).toBeDefined();
    expect(composited.isAvailable).toBe(true);
  });

  // Test A: Educational 3D Explainer
  it('Test A: runs educational Hindi animation with procedural 3D strategy', async () => {
    const user = await register('testa@example.com');
    const projectRes = await user.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', user.csrf)
      .send(hindiTrafficProject)
      .expect(201);
    const project = projectRes.body.data;
    expect(project.category).toBe('educational');

    // Generate script
    await user.agent.post(`/api/v1/projects/${project.id}/script/generate`).set('X-CSRF-Token', user.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const scriptRes = await user.agent.get(`/api/v1/projects/${project.id}/script`).expect(200);
    expect(scriptRes.body.data.scenes.length).toBe(4);
    expect(scriptRes.body.data.scenes[0].narration).toContain('चौराहे');

    // Approve script
    await user.agent.post(`/api/v1/projects/${project.id}/script/approve`).set('X-CSRF-Token', user.csrf).expect(200);

    // Generate scenes
    await user.agent.post(`/api/v1/projects/${project.id}/scenes/generate`).set('X-CSRF-Token', user.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const planRes = await user.agent.get(`/api/v1/projects/${project.id}/scenes`).expect(200);
    const plan = planRes.body.data;
    expect(plan.scenes[0].renderStrategy.type).toBe('procedural_3d');
    expect(plan.scenes[0].renderStrategy.template).toBe('traffic_intersection');
    expect(plan.scenes[0].audio.narrationEnabled).toBe(true);

    // Edit and approve scene plan
    const modified = [...plan.scenes];
    modified[0].renderStrategy.camera.zoom = 1.9;
    await user.agent
      .patch(`/api/v1/projects/${project.id}/scenes`)
      .set('X-CSRF-Token', user.csrf)
      .send({ expectedVersion: 1, totalDurationSeconds: 60, scenes: modified })
      .expect(200);

    await user.agent.post(`/api/v1/projects/${project.id}/scenes/approve`).set('X-CSRF-Token', user.csrf).expect(200);

    const final = await user.agent.get(`/api/v1/projects/${project.id}`).expect(200);
    expect(final.body.data.status).toBe('READY_TO_RENDER');
  });

  // Test B: Documentary Video
  it('Test B: runs documentary video with media composition and narration', async () => {
    const user = await register('testb@example.com');
    const projectRes = await user.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', user.csrf)
      .send(documentaryProject)
      .expect(201);
    const project = projectRes.body.data;
    expect(project.category).toBe('documentary');

    await user.agent.post(`/api/v1/projects/${project.id}/script/generate`).set('X-CSRF-Token', user.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const script = (await user.agent.get(`/api/v1/projects/${project.id}/script`).expect(200)).body.data;
    expect(script.scenes[0].narration).toContain('coral reefs');

    await user.agent.post(`/api/v1/projects/${project.id}/script/approve`).set('X-CSRF-Token', user.csrf).expect(200);

    await user.agent.post(`/api/v1/projects/${project.id}/scenes/generate`).set('X-CSRF-Token', user.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const plan = (await user.agent.get(`/api/v1/projects/${project.id}/scenes`).expect(200)).body.data;
    expect(plan.scenes[0].renderStrategy.type).toBe('uploaded_media');
    expect(plan.scenes[0].textOverlays.length).toBeGreaterThan(0);
    expect(plan.scenes[0].audio.narrationEnabled).toBe(true);

    await user.agent.post(`/api/v1/projects/${project.id}/scenes/approve`).set('X-CSRF-Token', user.csrf).expect(200);
    const final = (await user.agent.get(`/api/v1/projects/${project.id}`).expect(200)).body.data;
    expect(final.status).toBe('READY_TO_RENDER');
  });

  // Test C: Product Promotion
  it('Test C: runs product commercial with motion graphics, image showcase, and optional music', async () => {
    const user = await register('testc@example.com');
    const projectRes = await user.agent
      .post('/api/v1/projects')
      .set('X-CSRF-Token', user.csrf)
      .send(productPromoProject)
      .expect(201);
    const project = projectRes.body.data;
    expect(project.category).toBe('product_promo');
    expect(project.narrationEnabled).toBe(false);

    await user.agent.post(`/api/v1/projects/${project.id}/script/generate`).set('X-CSRF-Token', user.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    await user.agent.post(`/api/v1/projects/${project.id}/script/approve`).set('X-CSRF-Token', user.csrf).expect(200);

    await user.agent.post(`/api/v1/projects/${project.id}/scenes/generate`).set('X-CSRF-Token', user.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    const plan = (await user.agent.get(`/api/v1/projects/${project.id}/scenes`).expect(200)).body.data;
    // Multi-strategy composition in one video:
    expect(plan.scenes[0].renderStrategy.type).toBe('motion_graphics');
    expect(plan.scenes[1].renderStrategy.type).toBe('uploaded_media');
    expect(plan.scenes[2].renderStrategy.type).toBe('motion_graphics');
    expect(plan.scenes[0].audio.narrationEnabled).toBe(false);

    await user.agent.post(`/api/v1/projects/${project.id}/scenes/approve`).set('X-CSRF-Token', user.csrf).expect(200);
    const final = (await user.agent.get(`/api/v1/projects/${project.id}`).expect(200)).body.data;
    expect(final.status).toBe('READY_TO_RENDER');
  });

  it('enforces isolation: other accounts cannot view or modify scripts or scene plans', async () => {
    const userA = await register('usera@example.com');
    const userB = await register('userb@example.com');
    const projectA = (await userA.agent.post('/api/v1/projects').set('X-CSRF-Token', userA.csrf).send(hindiTrafficProject).expect(201)).body.data;

    await userA.agent.post(`/api/v1/projects/${projectA.id}/script/generate`).set('X-CSRF-Token', userA.csrf).expect(202);
    await new Promise((resolve) => setTimeout(resolve, 50));

    await userB.agent.get(`/api/v1/projects/${projectA.id}/script`).expect(404);
    await userB.agent
      .patch(`/api/v1/projects/${projectA.id}/script`)
      .set('X-CSRF-Token', userB.csrf)
      .send({
        expectedVersion: 1,
        title: 'Hacked Title',
        hook: 'Hacked Hook Text',
        scenes: [{ sceneNumber: 1, title: 'Hacked Scene', narration: 'Hacked Narration', visualDescription: 'Hacked visual description', durationSeconds: 60 }],
        totalDurationSeconds: 60,
      })
      .expect(404);

    await userB.agent.post(`/api/v1/projects/${projectA.id}/script/approve`).set('X-CSRF-Token', userB.csrf).expect(404);
  });
});
