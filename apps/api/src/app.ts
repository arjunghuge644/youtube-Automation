import express, { type Request } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import type { Connection } from 'mongoose';
import { z } from 'zod';
import {
  createProjectSchema,
  updateProjectSchema,
  registerSchema,
  loginSchema,
  updateScriptSchema,
  updateScenePlanSchema,
  updateStoryboardSchema,
  handoffCompleteSchema,
  regenerateSceneSchema,
  type Project,
} from '@creatorflow/shared';
import type { AppConfig } from './config.js';
import { ApiError, errorHandler } from './errors.js';
import { createModels, type Models } from './models.js';
import {
  clearSessionCookie,
  enforceOrigin,
  hashPassword,
  issueSession,
  requireAuth,
  requireCsrf,
  verifyPassword,
} from './security.js';
import { createPlanner } from './planner/llm-adapter.js';
import type { Planner } from './planner/types.js';
import { ProductionManager } from './production-manager.js';
import { createDefaultEngineRegistry } from './engines/registry.js';

export interface AppDependencies {
  connection: Connection;
  config: AppConfig;
  redisHealth: () => Promise<boolean>;
  models?: Models;
  planner?: Planner;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Please check the submitted fields.',
      result.error.issues.map(({ path, message }) => ({ field: path.join('.'), message })),
    );
  }
  return result.data;
}

function projectId(request: Request) {
  return parse(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid project ID.'), request.params.id);
}

type RecordLike = {
  _id: { toString(): string };
  ownerId: { toString(): string };
  title: string;
  prompt: string;
  category?: string;
  language: string;
  durationSeconds: number;
  aspectRatio: string;
  visualStyle: string;
  narrationStyle: string;
  narrationEnabled?: boolean;
  audience: string;
  resolution: string;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

function serializeProject(project: RecordLike): Project {
  return {
    id: project._id.toString(),
    ownerId: project.ownerId.toString(),
    title: project.title,
    prompt: project.prompt,
    category: (project.category || 'educational') as any,
    language: project.language as any,
    durationSeconds: project.durationSeconds,
    aspectRatio: project.aspectRatio as any,
    visualStyle: (project.visualStyle || 'stylized_3d') as any,
    narrationStyle: project.narrationStyle as any,
    narrationEnabled: project.narrationEnabled ?? true,
    audience: project.audience,
    resolution: project.resolution as any,
    status: project.status as any,
    version: project.version,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  } as Project;
}

function publicUser(user: { _id: { toString(): string }; name: string; email: string }) {
  return { id: user._id.toString(), name: user.name, email: user.email };
}

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

export function createApp({
  connection,
  config,
  redisHealth,
  models = createModels(connection),
  planner = createPlanner(),
}: AppDependencies) {
  const app = express();
  const productionManager = new ProductionManager({ models, planner });

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet());
  app.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.get('/health/live', (_request, response) => response.json({ status: 'ok', service: 'creatorflow-api' }));
  app.get('/health/ready', async (_request, response) => {
    const mongodb = connection.readyState === 1;
    let redis = false;
    try {
      redis = await redisHealth();
    } catch {
      /* dependency failure is reflected in readiness */
    }
    response.status(mongodb && redis ? 200 : 503).json({
      status: mongodb && redis ? 'ready' : 'degraded',
      dependencies: { mongodb, redis },
    });
  });
  const engines = createDefaultEngineRegistry();
  app.get('/api/v1/engines', async (_request, response) => {
    response.json({ data: await engines.listEngines() });
  });
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use(cookieParser());
  app.use('/api', enforceOrigin(config));
  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again shortly.' } },
  }));
  const authLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { error: { code: 'AUTH_RATE_LIMITED', message: 'Too many sign-in attempts. Try again in 15 minutes.' } },
  });
  const authenticate = requireAuth(models);

  app.post('/api/v1/auth/register', authLimit, async (request, response) => {
    const input = parse(registerSchema, request.body);
    const email = input.email.trim().toLowerCase();
    if (await models.User.exists({ email })) throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists.');
    const user = await models.User.create({ name: input.name, email, passwordHash: await hashPassword(input.password) });
    const csrfToken = await issueSession(models, config, response, user._id.toString(), request.cookies?.creatorflow_session);
    response.status(201).json({ data: { user: publicUser(user), csrfToken } });
  });

  app.post('/api/v1/auth/login', authLimit, async (request, response) => {
    const input = parse(loginSchema, request.body);
    const user = await models.User.findOne({ email: input.email.trim().toLowerCase() }).select('+passwordHash');
    const valid = await verifyPassword(input.password, user?.passwordHash ?? `scrypt:00000000000000000000000000000000:${'0'.repeat(128)}`);
    if (!user || !valid) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
    const csrfToken = await issueSession(models, config, response, user._id.toString(), request.cookies?.creatorflow_session);
    response.json({ data: { user: publicUser(user), csrfToken } });
  });

  app.get('/api/v1/auth/me', authenticate, async (request, response) => {
    const user = await models.User.findById(request.auth!.ownerId);
    if (!user) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
    response.json({ data: { user: publicUser(user), csrfToken: request.auth!.csrfToken } });
  });

  app.post('/api/v1/auth/logout', authenticate, requireCsrf, async (request, response) => {
    await models.Session.deleteOne({ tokenHash: request.auth!.tokenHash });
    clearSessionCookie(config, response);
    response.status(204).end();
  });

  // Projects & Production
  app.use('/api/v1/projects', authenticate, requireCsrf);

  app.post('/api/v1/projects', async (request, response) => {
    const input = parse(createProjectSchema, request.body);
    const project = await models.Project.create({ ...input, ownerId: request.auth!.ownerId, status: 'DRAFT', version: 1 });
    response.status(201).json({ data: serializeProject(project) });
  });

  app.get('/api/v1/projects', async (request, response) => {
    const { page, pageSize } = parse(paginationSchema, request.query);
    const filter = { ownerId: request.auth!.ownerId, deletedAt: null };
    const [projects, total] = await Promise.all([
      models.Project.find(filter).sort({ updatedAt: -1, _id: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
      models.Project.countDocuments(filter),
    ]);
    response.json({ data: projects.map(serializeProject), pagination: { page, pageSize, total } });
  });

  app.get('/api/v1/projects/:id', async (request, response) => {
    const project = await models.Project.findOne({ _id: projectId(request), ownerId: request.auth!.ownerId, deletedAt: null }).lean();
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    response.json({ data: serializeProject(project) });
  });

  async function preserveVersion(project: RecordLike) {
    await models.ProjectVersion.updateOne({ projectId: project._id, version: project.version }, {
      $setOnInsert: { ownerId: project.ownerId, projectId: project._id, version: project.version, snapshot: serializeProject(project) },
    }, { upsert: true });
  }

  app.patch('/api/v1/projects/:id', async (request, response) => {
    const { expectedVersion, ...changes } = parse(updateProjectSchema, request.body);
    const filter = { _id: projectId(request), ownerId: request.auth!.ownerId, deletedAt: null };
    const current = await models.Project.findOne(filter).lean();
    if (!current) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    if (current.status !== 'DRAFT') throw new ApiError(409, 'PROJECT_LOCKED', 'Only draft projects can have settings edited.');
    if (current.version !== expectedVersion) throw new ApiError(409, 'VERSION_CONFLICT', 'This project changed in another session. Reload before saving.');
    await preserveVersion(current);
    const project = await models.Project.findOneAndUpdate(
      { ...filter, version: expectedVersion, status: 'DRAFT' },
      { $set: changes, $inc: { version: 1 } },
      { new: true, runValidators: true },
    ).lean();
    if (!project) throw new ApiError(409, 'VERSION_CONFLICT', 'This project changed in another session. Reload before saving.');
    response.json({ data: serializeProject(project) });
  });

  app.delete('/api/v1/projects/:id', async (request, response) => {
    const filter = { _id: projectId(request), ownerId: request.auth!.ownerId, deletedAt: null };
    const current = await models.Project.findOne(filter).lean();
    if (!current) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    if (current.status !== 'DRAFT') throw new ApiError(409, 'PROJECT_LOCKED', 'Only draft projects can be deleted in this release.');
    await preserveVersion(current);
    const result = await models.Project.updateOne(
      { ...filter, version: current.version, status: 'DRAFT' },
      { $set: { deletedAt: new Date() }, $inc: { version: 1 } },
    );
    if (result.modifiedCount !== 1) throw new ApiError(409, 'VERSION_CONFLICT', 'This project changed. Reload before deleting.');
    response.status(204).end();
  });

  // Phase 2: Production State, Script, and Scene Plan Endpoints
  app.get('/api/v1/projects/:id/production', async (request, response) => {
    const state = await productionManager.getProductionState(projectId(request), request.auth!.ownerId);
    response.json({ data: state });
  });

  app.post('/api/v1/projects/:id/script/generate', async (request, response) => {
    const id = projectId(request);
    const project = await models.Project.findOne({ _id: id, ownerId: request.auth!.ownerId, deletedAt: null }).lean();
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    const job = await productionManager.startScriptGeneration(serializeProject(project), request.auth!.ownerId);
    response.status(202).json({ data: job });
  });

  app.get('/api/v1/projects/:id/script', async (request, response) => {
    const script = await productionManager.getScript(projectId(request), request.auth!.ownerId);
    response.json({ data: script });
  });

  app.patch('/api/v1/projects/:id/script', async (request, response) => {
    const input = parse(updateScriptSchema, request.body);
    const script = await productionManager.updateScript(projectId(request), request.auth!.ownerId, input);
    response.json({ data: script });
  });

  app.post('/api/v1/projects/:id/script/approve', async (request, response) => {
    const script = await productionManager.approveScript(projectId(request), request.auth!.ownerId);
    response.json({ data: script });
  });

  app.post('/api/v1/projects/:id/scenes/generate', async (request, response) => {
    const id = projectId(request);
    const project = await models.Project.findOne({ _id: id, ownerId: request.auth!.ownerId, deletedAt: null }).lean();
    if (!project) throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project not found.');
    const job = await productionManager.startScenePlanning(serializeProject(project), request.auth!.ownerId);
    response.status(202).json({ data: job });
  });

  app.get('/api/v1/projects/:id/scenes', async (request, response) => {
    const plan = await productionManager.getScenePlan(projectId(request), request.auth!.ownerId);
    response.json({ data: plan });
  });

  app.patch('/api/v1/projects/:id/scenes', async (request, response) => {
    const input = parse(updateScenePlanSchema, request.body);
    const plan = await productionManager.updateScenePlan(projectId(request), request.auth!.ownerId, input);
    response.json({ data: plan });
  });

  app.post('/api/v1/projects/:id/scenes/approve', async (request, response) => {
    const plan = await productionManager.approveScenePlan(projectId(request), request.auth!.ownerId);
    response.json({ data: plan });
  });

  // Storyboard & Universal Shot Planning Endpoints
  app.post('/api/v1/projects/:id/storyboard/generate', async (request, response) => {
    const storyboard = await productionManager.generateStoryboard(projectId(request), request.auth!.ownerId);
    response.status(201).json({ data: storyboard });
  });

  app.get('/api/v1/projects/:id/storyboard', async (request, response) => {
    const storyboard = await productionManager.getStoryboard(projectId(request), request.auth!.ownerId);
    response.json({ data: storyboard });
  });

  app.patch('/api/v1/projects/:id/storyboard', async (request, response) => {
    const input = parse(updateStoryboardSchema, request.body);
    const storyboard = await productionManager.updateStoryboard(projectId(request), request.auth!.ownerId, input);
    response.json({ data: storyboard });
  });

  app.post('/api/v1/projects/:id/storyboard/approve', async (request, response) => {
    const storyboard = await productionManager.approveStoryboard(projectId(request), request.auth!.ownerId);
    response.json({ data: storyboard });
  });

  // Workflow Engine (DAG) & Task Management Endpoints
  app.post('/api/v1/projects/:id/dag', async (request, response) => {
    const tasks = await productionManager.compileProductionDAG(projectId(request), request.auth!.ownerId);
    response.status(201).json({ data: tasks });
  });

  app.get('/api/v1/projects/:id/tasks', async (request, response) => {
    const tasks = await productionManager.getTasks(projectId(request), request.auth!.ownerId);
    response.json({ data: tasks });
  });

  app.post('/api/v1/projects/:id/tasks/:taskId/approve', async (request, response) => {
    const id = projectId(request);
    const taskId = parse(z.string().min(1), request.params.taskId);
    const task = await productionManager.approveTask(id, taskId, request.auth!.ownerId);
    response.json({ data: task });
  });

  // Manual Handoff Asset Ingestion with AUTOMATED Post-Production Execution
  app.post('/api/v1/projects/:id/tasks/:taskId/handoff-complete', async (request, response) => {
    const id = projectId(request);
    const taskId = parse(z.string().min(1), request.params.taskId);
    const input = parse(handoffCompleteSchema, request.body);

    const result = await productionManager.ingestAndValidateVideoHandoff(
      id,
      taskId,
      request.auth!.ownerId,
      input.filePath,
    );

    response.json({
      data: {
        task: result.task,
        asset: result.asset,
        autoProductionTriggered: result.autoProductionTriggered,
        qaResult: result.qaResult,
        exportPath: result.exportPath,
      },
    });
  });

  // Scene Invalidation & Partial Regeneration
  app.post('/api/v1/projects/:id/regenerate-scene', async (request, response) => {
    const id = projectId(request);
    const { sceneId } = parse(regenerateSceneSchema, request.body);
    const tasks = await productionManager.regenerateScene(id, sceneId, request.auth!.ownerId);
    response.json({ data: tasks });
  });

  // Quality Assurance & Media Assets
  app.get('/api/v1/projects/:id/qa', async (request, response) => {
    const qaReport = await productionManager.getQaReport(projectId(request), request.auth!.ownerId);
    response.json({ data: qaReport });
  });

  app.get('/api/v1/projects/:id/assets', async (request, response) => {
    const assets = await productionManager.getAssets(projectId(request), request.auth!.ownerId);
    response.json({ data: assets });
  });

  app.use((_request, _response, next) => next(new ApiError(404, 'NOT_FOUND', 'This endpoint does not exist.')));
  app.use(errorHandler);
  return app;
}
