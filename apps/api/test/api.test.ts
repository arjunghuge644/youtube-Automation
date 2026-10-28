import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose, { type Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { createModels, initializeIndexes, type Models } from '../src/models.js';

const config = loadConfig({ NODE_ENV: 'test' });
const project = {
  title: 'Why traffic builds up',
  prompt: 'Explain traffic congestion with moving cars and Hindi narration.',
  language: 'hi', durationSeconds: 60, aspectRatio: '9:16', visualStyle: 'stylized_3d',
  narrationStyle: 'documentary', audience: 'General audience', resolution: '720p',
};

describe('Phase 1 API against real MongoDB', () => {
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

  async function register(email = 'creator@example.com') {
    const agent = request.agent(app);
    const response = await agent.post('/api/v1/auth/register').send({ name: 'Creator', email, password: 'My secure password 2026!' }).expect(201);
    return { agent, csrf: response.body.data.csrfToken as string, user: response.body.data.user, response };
  }
  async function createProject(account: Awaited<ReturnType<typeof register>>) {
    return account.agent.post('/api/v1/projects').set('X-CSRF-Token', account.csrf).send(project).expect(201);
  }

  it('registers with hashed credentials and an HTTP-only session; login/logout revokes it', async () => {
    const account = await register();
    expect(account.response.body.data.user).toEqual({ id: expect.any(String), name: 'Creator', email: 'creator@example.com' });
    const setCookie = account.response.headers['set-cookie'] as unknown as string[];
    expect(setCookie[0]).toContain('HttpOnly');
    expect(setCookie[0]).toContain('SameSite=Lax');
    const user = await models.User.findOne().select('+passwordHash');
    expect(user!.passwordHash).toMatch(/^scrypt:/);
    expect(user!.passwordHash).not.toContain('My secure password');
    const session = await models.Session.findOne().lean();
    const rawToken = setCookie[0].split(';')[0].split('=')[1];
    expect(session!.tokenHash).not.toBe(rawToken);
    await account.agent.get('/api/v1/auth/me').expect(200);
    await account.agent.post('/api/v1/auth/logout').set('X-CSRF-Token', account.csrf).expect(204);
    await account.agent.get('/api/v1/auth/me').expect(401);
    await account.agent.post('/api/v1/auth/login').send({ email: 'creator@example.com', password: 'My secure password 2026!' }).expect(200);
    await account.agent.get('/api/v1/auth/me').expect(200);
  });

  it('does not allow unauthenticated project access', async () => {
    await request(app).get('/api/v1/projects').expect(401);
    await request(app).post('/api/v1/projects').send(project).expect(401);
  });

  it('normalizes email, prevents duplicate registration and rejects weak passwords', async () => {
    await register('CREATOR@example.com');
    await request(app).post('/api/v1/auth/register').send({ name: 'Other', email: 'creator@example.com', password: 'Another strong password' }).expect(409);
    await request(app).post('/api/v1/auth/register').send({ name: 'Other', email: 'other@example.com', password: 'weak' }).expect(400);
    const login = await request(app).post('/api/v1/auth/login').send({ email: 'creator@example.com', password: 'incorrect password' }).expect(401);
    expect(login.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('creates, lists, reads and updates an owned project with a preserved version', async () => {
    const account = await register();
    const created = await createProject(account);
    const id = created.body.data.id;
    expect(created.body.data).toMatchObject({ ...project, ownerId: account.user.id, status: 'DRAFT', version: 1 });
    const listed = await account.agent.get('/api/v1/projects?page=1&pageSize=10').expect(200);
    expect(listed.body.pagination).toEqual({ page: 1, pageSize: 10, total: 1 });
    expect(listed.body.data[0].id).toBe(id);
    await account.agent.get(`/api/v1/projects/${id}`).expect(200);
    const updated = await account.agent.patch(`/api/v1/projects/${id}`).set('X-CSRF-Token', account.csrf).send({ expectedVersion: 1, title: 'Updated title' }).expect(200);
    expect(updated.body.data).toMatchObject({ title: 'Updated title', version: 2 });
    const snapshot = await models.ProjectVersion.findOne({ projectId: id, version: 1 }).lean();
    expect(snapshot!.snapshot.title).toBe(project.title);
    expect(snapshot!.ownerId.toString()).toBe(account.user.id);
  });

  it('returns not-found for another user’s read/update/delete and hides it from their list', async () => {
    const owner = await register('owner@example.com');
    const other = await register('other@example.com');
    const created = await createProject(owner);
    const path = `/api/v1/projects/${created.body.data.id}`;
    const listed = await other.agent.get('/api/v1/projects').expect(200);
    expect(listed.body.data).toEqual([]);
    await other.agent.get(path).expect(404);
    await other.agent.patch(path).set('X-CSRF-Token', other.csrf).send({ expectedVersion: 1, title: 'Hijacked' }).expect(404);
    await other.agent.delete(path).set('X-CSRF-Token', other.csrf).expect(404);
    const unchanged = await owner.agent.get(path).expect(200);
    expect(unchanged.body.data.title).toBe(project.title);
  });

  it('rejects missing, incorrect and malformed CSRF tokens plus cross-origin changes', async () => {
    const account = await register();
    await account.agent.post('/api/v1/projects').send(project).expect(403);
    await account.agent.post('/api/v1/projects').set('X-CSRF-Token', 'incorrect').send(project).expect(403);
    await account.agent.post('/api/v1/projects').set('X-CSRF-Token', 'é'.repeat(64)).send(project).expect(403);
    await account.agent.post('/api/v1/projects').set('X-CSRF-Token', account.csrf).set('Origin', 'https://attacker.example').send(project).expect(403);
    await account.agent.post('/api/v1/projects').set('X-CSRF-Token', account.csrf).set('Sec-Fetch-Site', 'cross-site').send(project).expect(403);
    await account.agent.post('/api/v1/projects').set('X-CSRF-Token', account.csrf).set('Origin', config.appOrigin).send(project).expect(201);
  });

  it('rejects protected fields, malformed IDs, unknown settings and oversized payloads', async () => {
    const account = await register();
    for (const changes of [{ ownerId: account.user.id }, { status: 'COMPLETED' }, { durationSeconds: 999 }, { visualStyle: 'untrusted_code' }]) {
      await account.agent.post('/api/v1/projects').set('X-CSRF-Token', account.csrf).send({ ...project, ...changes }).expect(400);
    }
    await account.agent.get('/api/v1/projects/invalid-id').expect(400);
    await account.agent.get('/api/v1/projects?pageSize=10000').expect(400);
    await account.agent.post('/api/v1/projects').set('X-CSRF-Token', account.csrf).send({ ...project, prompt: 'x'.repeat(40_000) }).expect(413);
  });

  it('returns consistent errors for invalid JSON and unknown endpoints', async () => {
    const malformed = await request(app).post('/api/v1/auth/register').set('Content-Type', 'application/json').send('{').expect(400);
    expect(malformed.body.error.code).toBe('INVALID_JSON');
    const missing = await request(app).get('/api/v1/not-an-endpoint').expect(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
    expect(missing.headers['x-content-type-options']).toBe('nosniff');
    expect(missing.headers['x-powered-by']).toBeUndefined();
  });

  it('rejects stale versions and protects history when editors race', async () => {
    const account = await register();
    const created = await createProject(account);
    const path = `/api/v1/projects/${created.body.data.id}`;
    await account.agent.patch(path).set('X-CSRF-Token', account.csrf).send({ expectedVersion: 1, title: 'First edit' }).expect(200);
    const stale = await account.agent.patch(path).set('X-CSRF-Token', account.csrf).send({ expectedVersion: 1, title: 'Stale edit' }).expect(409);
    expect(stale.body.error.code).toBe('VERSION_CONFLICT');
    const results = await Promise.all(['Concurrent A', 'Concurrent B'].map((title) => account.agent.patch(path).set('X-CSRF-Token', account.csrf).send({ expectedVersion: 2, title })));
    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    const current = await account.agent.get(path).expect(200);
    expect(current.body.data.version).toBe(3);
    const previous = await models.ProjectVersion.findOne({ projectId: created.body.data.id, version: 2 }).lean();
    expect(previous!.snapshot.title).toBe('First edit');
  });

  it('preserves a project before soft deletion and removes it from normal access', async () => {
    const account = await register();
    const created = await createProject(account);
    const id = created.body.data.id;
    await account.agent.delete(`/api/v1/projects/${id}`).set('X-CSRF-Token', account.csrf).expect(204);
    await account.agent.get(`/api/v1/projects/${id}`).expect(404);
    const listed = await account.agent.get('/api/v1/projects').expect(200);
    expect(listed.body.pagination.total).toBe(0);
    const stored = await models.Project.findById(id).lean();
    expect(stored!.deletedAt).toBeInstanceOf(Date);
    expect(await models.ProjectVersion.countDocuments({ projectId: id })).toBe(1);
  });

  it('prevents draft editing or deletion after production starts', async () => {
    const account = await register();
    const created = await createProject(account);
    const id = created.body.data.id;
    await models.Project.updateOne({ _id: id }, { status: 'RENDERING' });
    await account.agent.patch(`/api/v1/projects/${id}`).set('X-CSRF-Token', account.csrf).send({ expectedVersion: 1, title: 'Unsafe edit' }).expect(409);
    await account.agent.delete(`/api/v1/projects/${id}`).set('X-CSRF-Token', account.csrf).expect(409);
  });

  it('enforces session expiry before MongoDB TTL cleanup occurs', async () => {
    const account = await register();
    await models.Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    await account.agent.get('/api/v1/auth/me').expect(401);
  });

  it('rotates and invalidates the previous session on login', async () => {
    const account = await register();
    const previousCookie = (account.response.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
    await account.agent.post('/api/v1/auth/login').send({ email: 'creator@example.com', password: 'My secure password 2026!' }).expect(200);
    await request(app).get('/api/v1/auth/me').set('Cookie', previousCookie).expect(401);
    expect(await models.Session.countDocuments()).toBe(1);
  });

  it('reports unavailable Redis honestly while MongoDB project routes still work', async () => {
    app = createApp({ connection, config, models, redisHealth: async () => false });
    await request(app).get('/health/live').expect(200);
    const health = await request(app).get('/health/ready').expect(503);
    expect(health.body.dependencies).toEqual({ mongodb: true, redis: false });
    const account = await register();
    await createProject(account);
  });

  it('limits repeated failed sign-in attempts', async () => {
    for (let count = 0; count < 20; count++) {
      await request(app).post('/api/v1/auth/login').send({ email: 'bad-email', password: '' }).expect(400);
    }
    const limited = await request(app).post('/api/v1/auth/login').send({ email: 'bad-email', password: '' }).expect(429);
    expect(limited.body.error.code).toBe('AUTH_RATE_LIMITED');
  });
});
