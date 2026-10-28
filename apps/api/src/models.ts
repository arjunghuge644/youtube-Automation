import { Schema, type Connection, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true, collection: 'users' });

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  csrfToken: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true, collection: 'sessions' });

const projectSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  prompt: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'educational', 'documentary', 'product_promo', 'storytelling',
      'social_short', 'tutorial', 'motivational', 'custom',
    ],
    default: 'educational',
    required: true,
  },
  language: { type: String, enum: ['hi', 'en', 'hinglish'], required: true },
  durationSeconds: { type: Number, min: 15, max: 180, required: true },
  aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1'], required: true },
  visualStyle: {
    type: String,
    enum: ['stylized_3d', 'motion_graphics', 'documentary_footage', 'minimal', 'cinematic'],
    default: 'stylized_3d',
    required: true,
  },
  narrationStyle: { type: String, enum: ['calm', 'energetic', 'documentary'], required: true },
  narrationEnabled: { type: Boolean, default: true, required: true },
  audience: { type: String, required: true },
  resolution: { type: String, enum: ['preview', '720p', '1080p'], required: true },
  status: {
    type: String,
    enum: [
      'DRAFT', 'SCRIPT_GENERATING', 'SCRIPT_REVIEW', 'SCENES_GENERATING',
      'SCENES_REVIEW', 'ASSETS_GENERATING', 'READY_TO_RENDER', 'RENDERING',
      'QUALITY_CHECK', 'COMPLETED', 'FAILED',
    ],
    default: 'DRAFT',
    required: true,
  },
  version: { type: Number, default: 1, required: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'projects' });
projectSchema.index({ ownerId: 1, deletedAt: 1, updatedAt: -1 });

const projectVersionSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  version: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true, collection: 'project_versions' });
projectVersionSchema.index({ projectId: 1, version: 1 }, { unique: true });
projectVersionSchema.index({ ownerId: 1, projectId: 1 });

// Script Model
const scriptSceneDbSchema = new Schema({
  sceneNumber: { type: Number, required: true },
  title: { type: String, required: true },
  narration: { type: String, default: '' },
  visualDescription: { type: String, required: true },
  durationSeconds: { type: Number, required: true },
}, { _id: false });

const scriptSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  hook: { type: String, required: true },
  scenes: { type: [scriptSceneDbSchema], required: true },
  totalDurationSeconds: { type: Number, required: true },
  version: { type: Number, default: 1, required: true },
  approved: { type: Boolean, default: false, required: true },
  approvedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'scripts' });
scriptSchema.index({ ownerId: 1, projectId: 1 });

const scriptVersionSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  scriptId: { type: Schema.Types.ObjectId, ref: 'Script', required: true },
  version: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true, collection: 'script_versions' });
scriptVersionSchema.index({ projectId: 1, version: 1 }, { unique: true });

// Universal Scene Plan Model (Mixed scenes schema supports discriminated union render strategies)
const scenePlanSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  scenes: { type: [Schema.Types.Mixed], required: true },
  totalDurationSeconds: { type: Number, required: true },
  version: { type: Number, default: 1, required: true },
  approved: { type: Boolean, default: false, required: true },
  approvedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'scene_plans' });
scenePlanSchema.index({ ownerId: 1, projectId: 1 });

const scenePlanVersionSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  scenePlanId: { type: Schema.Types.ObjectId, ref: 'ScenePlan', required: true },
  version: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true, collection: 'scene_plan_versions' });
scenePlanVersionSchema.index({ projectId: 1, version: 1 }, { unique: true });

// Storyboard Model
const storyboardSceneDbSchema = new Schema({
  sceneNumber: { type: Number, required: true },
  title: { type: String, required: true },
  durationSeconds: { type: Number, required: true },
  visualDescription: { type: String, required: true },
  cameraMotion: { type: String, default: 'cinematic slow pan' },
  lighting: { type: String, default: 'natural cinematic lighting' },
  providerPrompt: { type: String, required: true },
  negativePrompt: { type: String, default: '' },
  narrationText: { type: String, default: '' },
  narrationEnabled: { type: Boolean, default: true },
  suggestedProvider: { type: String, default: 'google_flow' },
  aspectRatio: { type: String, enum: ['9:16', '16:9', '1:1'], default: '9:16' },
}, { _id: false });

const storyboardSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true },
  scenes: { type: [storyboardSceneDbSchema], required: true },
  totalDurationSeconds: { type: Number, required: true },
  version: { type: Number, default: 1, required: true },
  approved: { type: Boolean, default: false, required: true },
  approvedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'storyboards' });
storyboardSchema.index({ ownerId: 1, projectId: 1 });

const storyboardVersionSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  storyboardId: { type: Schema.Types.ObjectId, ref: 'Storyboard', required: true },
  version: { type: Number, required: true },
  snapshot: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true, collection: 'storyboard_versions' });
storyboardVersionSchema.index({ projectId: 1, version: 1 }, { unique: true });

// Production Task Model (Workflow Engine DAG Node)
const taskSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  sceneId: { type: String, default: null },
  taskId: { type: String, required: true }, // e.g. task_video_scene_1
  type: {
    type: String,
    enum: [
      'SCRIPT_GENERATION', 'SCRIPT_APPROVAL', 'STORYBOARD_GENERATION',
      'SCENE_PROMPT_OPTIMIZATION', 'VIDEO_GENERATION', 'AUDIO_NARRATION',
      'MUSIC_SELECTION', 'ASSET_INGESTION', 'ASSET_VALIDATION',
      'TIMELINE_ASSEMBLY', 'QUALITY_ASSURANCE', 'EXPORT',
    ],
    required: true,
  },
  name: { type: String, required: true },
  state: {
    type: String,
    enum: [
      'pending', 'ready', 'queued', 'running',
      'awaiting_external_action', 'awaiting_approval',
      'completed', 'failed', 'retry_scheduled',
      'blocked', 'cancelled', 'skipped',
    ],
    default: 'pending',
    required: true,
  },
  prerequisiteTaskIds: { type: [String], default: [] },
  providerId: { type: String, default: null },
  mode: { type: String, enum: ['api', 'manual_handoff', 'local'], default: 'local', required: true },
  inputPayload: { type: Schema.Types.Mixed, default: {} },
  outputPayload: { type: Schema.Types.Mixed, default: null },
  idempotencyKey: { type: String, required: true },
  attempts: { type: Number, default: 0, required: true },
  maxAttempts: { type: Number, default: 3, required: true },
  error: { type: String, default: null },
  manualHandoffSpec: { type: Schema.Types.Mixed, default: null },
  externalJobId: { type: String, default: null },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'tasks' });
taskSchema.index({ projectId: 1, taskId: 1 }, { unique: true });
taskSchema.index({ projectId: 1, state: 1 });
taskSchema.index({ idempotencyKey: 1 });

// Media Asset Model
const assetSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  sceneId: { type: String, default: null },
  taskId: { type: String, required: true, index: true },
  provider: { type: String, required: true },
  type: { type: String, enum: ['video', 'audio', 'image', 'subtitle'], required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  durationSeconds: { type: Number, default: 0, required: true },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  checksum: { type: String, required: true },
  isValidated: { type: Boolean, default: false, required: true },
  validationReport: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true, collection: 'assets' });
assetSchema.index({ projectId: 1, sceneId: 1, type: 1 });

// Provider Configuration Model
const providerConfigSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: String, required: true },
  providerType: { type: String, enum: ['llm', 'video', 'audio', 'image'], required: true },
  isEnabled: { type: Boolean, default: true, required: true },
  apiKeyEncrypted: { type: String, default: null },
  monthlyBudgetUsd: { type: Number, default: 0, required: true },
  usedBudgetUsd: { type: Number, default: 0, required: true },
  isFreeTierOnly: { type: Boolean, default: true, required: true },
  customSettings: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, collection: 'provider_configs' });
providerConfigSchema.index({ ownerId: 1, providerId: 1 }, { unique: true });

// Production Events / Audit Trail
const productionEventSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  taskId: { type: String, default: null },
  eventType: { type: String, required: true },
  previousState: { type: String, default: null },
  newState: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, collection: 'production_events' });
productionEventSchema.index({ projectId: 1, createdAt: -1 });

// Production Job Model (Legacy compatibility)
const productionJobSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  jobType: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING', required: true },
  progress: { type: Number, default: 0, min: 0, max: 100, required: true },
  error: { type: String, default: null },
}, { timestamps: true, collection: 'production_jobs' });
productionJobSchema.index({ projectId: 1, createdAt: -1 });

export type ProjectRecord = InferSchemaType<typeof projectSchema>;
export type ScriptRecord = InferSchemaType<typeof scriptSchema>;
export type StoryboardRecord = InferSchemaType<typeof storyboardSchema>;
export type TaskRecord = InferSchemaType<typeof taskSchema>;
export type AssetRecord = InferSchemaType<typeof assetSchema>;
export type ScenePlanRecord = InferSchemaType<typeof scenePlanSchema>;
export type ProductionJobRecord = InferSchemaType<typeof productionJobSchema>;

export function createModels(connection: Connection) {
  return {
    User: connection.model('User', userSchema),
    Session: connection.model('Session', sessionSchema),
    Project: connection.model('Project', projectSchema),
    ProjectVersion: connection.model('ProjectVersion', projectVersionSchema),
    Script: connection.model('Script', scriptSchema),
    ScriptVersion: connection.model('ScriptVersion', scriptVersionSchema),
    Storyboard: connection.model('Storyboard', storyboardSchema),
    StoryboardVersion: connection.model('StoryboardVersion', storyboardVersionSchema),
    Task: connection.model('Task', taskSchema),
    Asset: connection.model('Asset', assetSchema),
    ProviderConfig: connection.model('ProviderConfig', providerConfigSchema),
    ProductionEvent: connection.model('ProductionEvent', productionEventSchema),
    ScenePlan: connection.model('ScenePlan', scenePlanSchema),
    ScenePlanVersion: connection.model('ScenePlanVersion', scenePlanVersionSchema),
    ProductionJob: connection.model('ProductionJob', productionJobSchema),
  };
}

export type Models = ReturnType<typeof createModels>;

export async function initializeIndexes(models: Models) {
  await Promise.all(Object.values(models).map((model) => model.init()));
}
