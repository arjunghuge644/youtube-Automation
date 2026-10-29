import { z } from 'zod';

export const projectStatuses = [
  'DRAFT', 'SCRIPT_GENERATING', 'SCRIPT_REVIEW', 'SCENES_GENERATING',
  'SCENES_REVIEW', 'ASSETS_GENERATING', 'READY_TO_RENDER', 'RENDERING',
  'QUALITY_CHECK', 'COMPLETED', 'FAILED',
] as const;
export const projectStatusSchema = z.enum(projectStatuses);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const videoCategories = [
  'educational', 'documentary', 'product_promo', 'storytelling',
  'social_short', 'tutorial', 'motivational', 'custom',
] as const;
export const videoCategorySchema = z.enum(videoCategories);
export type VideoCategory = z.infer<typeof videoCategorySchema>;

export const visualStyles = [
  'stylized_3d', 'motion_graphics', 'documentary_footage', 'minimal', 'cinematic', 'technical_explainer',
] as const;
export const visualStyleSchema = z.enum(visualStyles);
export type VisualStyle = z.infer<typeof visualStyleSchema>;

export const projectFields = {
  title: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(10).max(5000),
  category: videoCategorySchema,
  language: z.enum(['hi', 'en', 'hinglish']),
  durationSeconds: z.number().int().min(15).max(180),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']),
  visualStyle: visualStyleSchema,
  narrationStyle: z.enum(['calm', 'energetic', 'documentary']),
  narrationEnabled: z.boolean(),
  audience: z.string().trim().min(1).max(200),
  resolution: z.enum(['preview', '720p', '1080p']),
};

export const createProjectSchema = z.object(projectFields).extend({
  category: projectFields.category.default('educational'),
  language: projectFields.language.default('hi'),
  durationSeconds: projectFields.durationSeconds.default(60),
  aspectRatio: projectFields.aspectRatio.default('9:16'),
  visualStyle: projectFields.visualStyle.default('stylized_3d'),
  narrationStyle: projectFields.narrationStyle.default('documentary'),
  narrationEnabled: projectFields.narrationEnabled.default(true),
  audience: projectFields.audience.default('General audience'),
  resolution: projectFields.resolution.default('720p'),
}).strict();
export type ProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object(projectFields).partial().extend({
  expectedVersion: z.number().int().min(1),
}).strict().refine((value) => Object.keys(value).some((key) => key !== 'expectedVersion'), {
  message: 'Include at least one field to update.',
});
export type ProjectUpdate = z.infer<typeof updateProjectSchema>;

export interface Project extends ProjectInput {
  id: string;
  ownerId: string;
  status: ProjectStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

const email = z.email().trim().toLowerCase().max(254);
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email,
  password: z.string().min(12, 'Use at least 12 characters.').max(128),
}).strict();
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
}).strict();
export interface User { id: string; name: string; email: string }
export interface PublicAuth { user: User; csrfToken: string }
export interface ApiResponse<T> { data: T }
export interface ApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}
export interface PaginatedProjects extends ApiResponse<Project[]> {
  pagination: {page: number; pageSize: number; total: number};
}

// Structured Script Planning
export const scriptSceneSchema = z.object({
  sceneNumber: z.number().int().min(1).max(20),
  title: z.string().trim().min(1).max(100),
  narration: z.string().trim().max(2000).default(''),
  visualDescription: z.string().trim().min(5).max(1000),
  durationSeconds: z.number().int().min(2).max(60),
}).strict();
export type ScriptScene = z.infer<typeof scriptSceneSchema>;

export const scriptSchema = z.object({
  title: z.string().trim().min(1).max(120),
  hook: z.string().trim().min(5).max(500),
  scenes: z.array(scriptSceneSchema).min(1).max(20),
  totalDurationSeconds: z.number().int().min(10).max(180),
}).strict();
export type ScriptData = z.infer<typeof scriptSchema>;

export interface ProjectScript extends ScriptData {
  id: string;
  projectId: string;
  version: number;
  approved: boolean;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const updateScriptSchema = scriptSchema.extend({
  expectedVersion: z.number().int().min(1),
}).strict();
export type UpdateScriptInput = z.infer<typeof updateScriptSchema>;

// Universal Scene Schema & Discriminated Render Strategies
export const cameraConfigSchema = z.object({
  type: z.enum(['orbit', 'top_down', 'driver_view', 'cinematic', 'static']),
  zoom: z.number().min(0.5).max(3.0),
  angleDegrees: z.number().min(-180).max(180),
}).strict();
export type CameraConfig = z.infer<typeof cameraConfigSchema>;

export const trafficConfigSchema = z.object({
  density: z.enum(['light', 'moderate', 'congested', 'gridlock']),
  vehicleCount: z.number().int().min(1).max(100),
  averageSpeed: z.number().min(0).max(80),
  trafficSignalState: z.enum(['green', 'yellow', 'red', 'all_red']),
}).strict();
export type TrafficConfig = z.infer<typeof trafficConfigSchema>;

export const subtitleItemSchema = z.object({
  text: z.string().trim().min(1).max(300),
  startSeconds: z.number().min(0).max(180),
  endSeconds: z.number().min(0).max(180),
}).strict().refine((data) => data.endSeconds >= data.startSeconds, {
  message: 'endSeconds must be greater than or equal to startSeconds',
});
export type SubtitleItem = z.infer<typeof subtitleItemSchema>;

export const transitions = ['fade', 'cut', 'slide_left', 'dissolve', 'wipe'] as const;
export const transitionSchema = z.enum(transitions);
export type TransitionType = z.infer<typeof transitionSchema>;

// Discriminated Render Strategies
export const motionGraphicsStrategySchema = z.object({
  type: z.literal('motion_graphics'),
  headline: z.string().trim().min(1).max(150),
  subheadline: z.string().trim().max(250).optional(),
  style: z.enum(['bold_minimal', 'kinetic_typography', 'infographic', 'product_card']),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundAnimation: z.enum(['particles', 'geometric_pulse', 'subtle_grid', 'solid']),
}).strict();

export const procedural3DStrategySchema = z.object({
  type: z.literal('procedural_3d'),
  template: z.string().min(1).max(50),
  camera: cameraConfigSchema,
  parameters: z.record(z.string(), z.any()),
  deterministicSeed: z.number().int().min(1).max(2147483647),
}).strict();

export const uploadedMediaStrategySchema = z.object({
  type: z.literal('uploaded_media'),
  assetId: z.string().min(1),
  mediaType: z.enum(['image', 'video']),
  fit: z.enum(['cover', 'contain', 'crop']),
  motion: z.enum(['static', 'pan_left', 'pan_right', 'zoom_in', 'zoom_out', 'ken_burns']),
  trim: z.object({
    startSeconds: z.number().min(0),
    endSeconds: z.number().min(0),
  }).optional(),
}).strict();

export const aiImageStrategySchema = z.object({
  type: z.literal('ai_image'),
  prompt: z.string().trim().min(1).max(1000),
  stylePreset: z.string().optional(),
  motion: z.enum(['static', 'zoom_in', 'pan', 'ken_burns']),
}).strict();

export const aiVideoStrategySchema = z.object({
  type: z.literal('ai_video'),
  prompt: z.string().trim().min(1).max(1000),
  seed: z.number().optional(),
}).strict();

export const stockFootageStrategySchema = z.object({
  type: z.literal('stock_footage'),
  query: z.string().trim().min(1).max(200),
  clipId: z.string().optional(),
  trim: z.object({
    startSeconds: z.number().min(0),
    endSeconds: z.number().min(0),
  }).optional(),
}).strict();

export const compositedSceneStrategySchema = z.object({
  type: z.literal('composited_scene'),
  background: z.object({ type: z.string(), source: z.string() }).strict(),
  layers: z.array(z.record(z.string(), z.any())),
}).strict();

// Remotion Technical Explainer Component Schemas
export const remotionExplainerComponentTypes = [
  'interview_question',
  'database_transaction',
  'cache_layer',
  'search_engine',
  'geospatial_map',
  'system_architecture',
  'kinetic_typography',
  'flowchart',
  'comparison',
  'process_timeline',
  'concept_breakdown',
  'statistics',
  'data_flow',
  'ui_walkthrough',
  'network_diagram',
  'generic_infographic',
] as const;
export const remotionExplainerComponentTypeSchema = z.enum(remotionExplainerComponentTypes);
export type RemotionExplainerComponentType = z.infer<typeof remotionExplainerComponentTypeSchema>;

export const interviewOptionSchema = z.object({
  id: z.number().int(),
  label: z.string().trim().min(1),
  text: z.string().trim().min(1),
  strikethrough: z.boolean().default(false),
  badge: z.string().trim().optional(),
}).strict();

export const interviewQuestionPropsSchema = z.object({
  headerText: z.string().trim().default('INTERVIEWER:'),
  timestampText: z.string().trim().default('● 00:03'),
  question: z.string().trim().min(1),
  underlinedKeyword: z.string().trim().optional(),
  punchline: z.string().trim().min(1),
  highlightWord: z.string().trim().optional(),
  options: z.array(interviewOptionSchema).default([]),
}).strict();
export type InterviewQuestionProps = z.infer<typeof interviewQuestionPropsSchema>;

export const transactionStepSchema = z.object({
  stepNumber: z.number().int(),
  title: z.string().trim().min(1),
  status: z.enum(['success', 'failed', 'pending']),
  errorMsg: z.string().trim().optional(),
}).strict();

export const databaseTransactionPropsSchema = z.object({
  transaction: z.object({
    time: z.string().trim(),
    item: z.string().trim(),
    amount: z.string().trim(),
    paymentMethod: z.string().trim(),
    status: z.enum(['PENDING', 'PAID', 'FAILED']).default('PENDING'),
  }).strict(),
  database: z.object({
    name: z.string().trim(),
    type: z.string().trim().default('main database'),
    columns: z.array(z.object({
      label: z.string().trim(),
      value: z.string().trim(),
      color: z.string().optional(),
    }).strict()),
  }).strict(),
  steps: z.array(transactionStepSchema).default([]),
  crashAlert: z.object({
    triggerAtStep: z.number().int(),
    message: z.string().trim(),
  }).strict().optional(),
  impactText: z.object({
    text: z.string().trim(),
    color: z.string().optional(),
  }).strict().optional(),
}).strict();
export type DatabaseTransactionProps = z.infer<typeof databaseTransactionPropsSchema>;

export const cacheLayerPropsSchema = z.object({
  clientGrid: z.object({
    rows: z.number().int().min(1).max(5).default(2),
    columns: z.number().int().min(1).max(12).default(9),
    activeCount: z.number().int().default(14),
  }).strict(),
  cache: z.object({
    name: z.string().trim().default('CACHE · REDIS (in memory)'),
    status: z.enum(['HIT', 'MISS']).default('MISS'),
    ttl: z.string().trim().default('0:00'),
  }).strict(),
  transferBadge: z.string().trim().default('MENU COPY'),
  database: z.object({
    name: z.string().trim().default('POSTGRES main database'),
    loadPercentage: z.number().min(0).max(100).default(80),
    operations: z.array(z.string().trim()).default([]),
    updatedItem: z.object({
      label: z.string().trim(),
      name: z.string().trim(),
      oldValue: z.string().trim(),
      newValue: z.string().trim(),
    }).strict().optional(),
  }).strict(),
  incomingOrders: z.array(z.string().trim()).default([]),
}).strict();
export type CacheLayerProps = z.infer<typeof cacheLayerPropsSchema>;

export const searchEnginePropsSchema = z.object({
  searchQuery: z.string().trim(),
  hasTypo: z.boolean().default(true),
  typoLabel: z.string().trim().default('TYPO'),
  engine: z.object({
    name: z.string().trim().default('SEARCH ENGINE'),
    technology: z.string().trim().default('Elasticsearch'),
    tokens: z.array(z.string().trim()).default([]),
    fuzzyMatch: z.string().trim().optional(),
  }).strict(),
}).strict();
export type SearchEngineProps = z.infer<typeof searchEnginePropsSchema>;

export const geospatialMapPropsSchema = z.object({
  customer: z.object({
    label: z.string().trim().default('Customer'),
    radiusKm: z.number().default(3),
  }).strict(),
  riderCount: z.number().int().min(5).max(100).default(35),
  dataStreamLabel: z.string().trim().default('LOCATION WRITES'),
  writeCount: z.string().trim().default('2,434'),
  loadPercentage: z.number().min(0).max(100).default(75),
  indexCard: z.object({
    title: z.string().trim().default('GEO INDEX · geohash cells'),
    subtitle: z.string().trim().default('e.g. Redis GEO, in memory'),
  }).strict(),
}).strict();
export type GeospatialMapProps = z.infer<typeof geospatialMapPropsSchema>;

export const systemArchitecturePropsSchema = z.object({
  sourceOfTruth: z.object({
    badge: z.string().trim().default('SOURCE OF TRUTH'),
    type: z.string().trim().default('RELATIONAL DB'),
    name: z.string().trim().default('POSTGRES'),
    details: z.string().trim().default('orders + money'),
  }).strict(),
  branches: z.array(z.object({
    title: z.string().trim(),
    subtitle: z.string().trim(),
    badge: z.string().trim().optional(),
  }).strict()).default([]),
  statusNotes: z.array(z.object({
    icon: z.enum(['check', 'cross']),
    text: z.string().trim(),
    accent: z.enum(['emerald', 'coral', 'yellow']),
  }).strict()).default([]),
  punchline: z.object({
    text: z.string().trim(),
    highlightWord: z.string().trim().optional(),
  }).strict().optional(),
}).strict();
export type SystemArchitectureProps = z.infer<typeof systemArchitecturePropsSchema>;

export const kineticTypographyPropsSchema = z.object({
  heading: z.string().trim().optional(),
  subheading: z.string().trim().optional(),
  punchline: z.string().trim(),
  highlightWord: z.string().trim().optional(),
  badges: z.array(z.object({
    icon: z.enum(['check', 'cross', 'alert', 'bolt']),
    text: z.string().trim(),
    status: z.enum(['success', 'danger', 'warning', 'info']),
  }).strict()).default([]),
  card: z.object({
    tag: z.string().trim(),
    title: z.string().trim(),
    subtitle: z.string().trim(),
  }).strict().optional(),
}).strict();
export type KineticTypographyProps = z.infer<typeof kineticTypographyPropsSchema>;

export const flowchartPropsSchema = z.object({
  title: z.string().trim().default('SYSTEM WORKFLOW'),
  subtitle: z.string().trim().optional(),
  nodes: z.array(z.object({
    id: z.string().trim(),
    label: z.string().trim(),
    sublabel: z.string().trim().optional(),
    type: z.enum(['start', 'process', 'decision', 'end', 'database']).default('process'),
    status: z.enum(['active', 'success', 'warning', 'error', 'default']).default('default'),
  }).strict()).min(2),
  connections: z.array(z.object({
    from: z.string().trim(),
    to: z.string().trim(),
    label: z.string().trim().optional(),
    animated: z.boolean().default(true),
    style: z.enum(['solid', 'dashed']).default('solid'),
  }).strict()).default([]),
  activeNodeId: z.string().trim().optional(),
  summaryBadge: z.object({
    text: z.string().trim(),
    type: z.enum(['info', 'success', 'warning']).default('info'),
  }).strict().optional(),
}).strict();
export type FlowchartProps = z.infer<typeof flowchartPropsSchema>;

export const comparisonPropsSchema = z.object({
  title: z.string().trim().default('CORE COMPARISON'),
  versusLabel: z.string().trim().default('VS'),
  leftSide: z.object({
    title: z.string().trim(),
    subtitle: z.string().trim().optional(),
    badge: z.string().trim().optional(),
    accentColor: z.string().trim().default('#38BDF8'),
    items: z.array(z.object({
      title: z.string().trim(),
      description: z.string().trim().optional(),
      icon: z.enum(['check', 'cross', 'warning', 'info', 'neutral']).default('neutral'),
    }).strict()).default([]),
  }).strict(),
  rightSide: z.object({
    title: z.string().trim(),
    subtitle: z.string().trim().optional(),
    badge: z.string().trim().optional(),
    accentColor: z.string().trim().default('#F43F5E'),
    items: z.array(z.object({
      title: z.string().trim(),
      description: z.string().trim().optional(),
      icon: z.enum(['check', 'cross', 'warning', 'info', 'neutral']).default('neutral'),
    }).strict()).default([]),
  }).strict(),
  verdict: z.object({
    text: z.string().trim(),
    winner: z.enum(['left', 'right', 'both', 'context_dependent']).default('context_dependent'),
    highlight: z.string().trim().optional(),
  }).strict().optional(),
}).strict();
export type ComparisonProps = z.infer<typeof comparisonPropsSchema>;

export const processTimelinePropsSchema = z.object({
  title: z.string().trim().default('EXECUTION LIFECYCLE'),
  subtitle: z.string().trim().optional(),
  steps: z.array(z.object({
    stepNumber: z.number().int().min(1),
    title: z.string().trim(),
    description: z.string().trim().optional(),
    status: z.enum(['completed', 'in_progress', 'pending', 'failed']).default('pending'),
    badge: z.string().trim().optional(),
    duration: z.string().trim().optional(),
  }).strict()).min(2),
  currentStepIndex: z.number().int().min(0).default(0),
  metric: z.object({
    label: z.string().trim(),
    value: z.string().trim(),
  }).strict().optional(),
}).strict();
export type ProcessTimelineProps = z.infer<typeof processTimelinePropsSchema>;

export const conceptBreakdownPropsSchema = z.object({
  coreConcept: z.object({
    title: z.string().trim(),
    category: z.string().trim().optional(),
    tag: z.string().trim().optional(),
  }).strict(),
  pillars: z.array(z.object({
    title: z.string().trim(),
    description: z.string().trim(),
    icon: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    accentColor: z.string().trim().optional(),
  }).strict()).min(2).max(6),
  takeaway: z.object({
    headline: z.string().trim(),
    subtext: z.string().trim().optional(),
  }).strict().optional(),
}).strict();
export type ConceptBreakdownProps = z.infer<typeof conceptBreakdownPropsSchema>;

export const statisticsPropsSchema = z.object({
  headline: z.string().trim(),
  subheadline: z.string().trim().optional(),
  primaryStat: z.object({
    value: z.union([z.string().trim(), z.number()]),
    label: z.string().trim(),
    change: z.string().trim().optional(),
    trend: z.enum(['up', 'down', 'neutral']).default('up'),
    unit: z.string().trim().optional(),
  }).strict(),
  secondaryStats: z.array(z.object({
    value: z.union([z.string().trim(), z.number()]),
    label: z.string().trim(),
    detail: z.string().trim().optional(),
    accentColor: z.string().trim().optional(),
  }).strict()).default([]),
  chartType: z.enum(['bars', 'progress', 'comparison', 'kpi']).default('bars'),
  chartData: z.array(z.object({
    label: z.string().trim(),
    value: z.number(),
    maxValue: z.number().optional(),
    color: z.string().trim().optional(),
  }).strict()).default([]),
}).strict();
export type StatisticsProps = z.infer<typeof statisticsPropsSchema>;

export const dataFlowPropsSchema = z.object({
  title: z.string().trim().default('REALTIME DATA PIPELINE'),
  stages: z.array(z.object({
    id: z.string().trim(),
    name: z.string().trim(),
    type: z.enum(['source', 'queue', 'processor', 'storage', 'client']).default('processor'),
    throughput: z.string().trim().optional(),
    status: z.enum(['idle', 'processing', 'congested', 'healthy']).default('healthy'),
  }).strict()).min(2),
  packetLabel: z.string().trim().default('PAYLOAD'),
  metrics: z.array(z.object({
    label: z.string().trim(),
    value: z.string().trim(),
  }).strict()).default([]),
  alert: z.object({
    message: z.string().trim(),
    severity: z.enum(['warning', 'critical', 'info']).default('info'),
  }).strict().optional(),
}).strict();
export type DataFlowProps = z.infer<typeof dataFlowPropsSchema>;

export const uiWalkthroughPropsSchema = z.object({
  appName: z.string().trim().default('CreatorFlow AI'),
  appUrl: z.string().trim().default('app.creatorflow.io'),
  windowTitle: z.string().trim().default('Interactive Dashboard'),
  highlights: z.array(z.object({
    targetArea: z.string().trim(),
    title: z.string().trim(),
    description: z.string().trim(),
    badge: z.string().trim().optional(),
    stepNumber: z.number().int().optional(),
  }).strict()).min(1),
  callToAction: z.object({
    text: z.string().trim(),
    buttonLabel: z.string().trim().default('Get Started Now'),
  }).strict().optional(),
  previewMetrics: z.array(z.object({
    label: z.string().trim(),
    value: z.string().trim(),
  }).strict()).default([]),
}).strict();
export type UIWalkthroughProps = z.infer<typeof uiWalkthroughPropsSchema>;

export const networkDiagramPropsSchema = z.object({
  title: z.string().trim().default('DISTRIBUTED TOPOLOGY'),
  topology: z.enum(['mesh', 'star', 'hub_spoke', 'cluster', 'tree']).default('hub_spoke'),
  centralNode: z.object({
    id: z.string().trim(),
    label: z.string().trim(),
    role: z.string().trim().default('COORDINATOR / GATEWAY'),
    status: z.enum(['active', 'standby', 'overloaded']).default('active'),
  }).strict(),
  peripheralNodes: z.array(z.object({
    id: z.string().trim(),
    label: z.string().trim(),
    role: z.string().trim().optional(),
    latencyMs: z.number().optional(),
    status: z.enum(['healthy', 'degraded', 'offline']).default('healthy'),
  }).strict()).min(2),
  bandwidthMetric: z.string().trim().optional(),
  securityBadge: z.string().trim().optional(),
}).strict();
export type NetworkDiagramProps = z.infer<typeof networkDiagramPropsSchema>;

export const genericInfographicPropsSchema = z.object({
  header: z.object({
    title: z.string().trim(),
    subtitle: z.string().trim().optional(),
    badge: z.string().trim().optional(),
  }).strict(),
  sections: z.array(z.object({
    title: z.string().trim(),
    body: z.string().trim(),
    highlight: z.string().trim().optional(),
    badge: z.string().trim().optional(),
    accentColor: z.string().trim().optional(),
  }).strict()).min(1).max(5),
  callout: z.object({
    quote: z.string().trim(),
    authorOrSource: z.string().trim().optional(),
  }).strict().optional(),
  footerTag: z.string().trim().optional(),
}).strict();
export type GenericInfographicProps = z.infer<typeof genericInfographicPropsSchema>;

export const explainerHeaderSchema = z.object({
  topicTag: z.string().trim().min(1).max(60).default('SYSTEM DESIGN · 001'),
  channelHandle: z.string().trim().min(1).max(60).default('@creatorflow'),
  actNumber: z.string().trim().min(1).max(10).default('00'),
  actTitle: z.string().trim().min(1).max(80).default('OVERVIEW'),
}).strict();
export type ExplainerHeader = z.infer<typeof explainerHeaderSchema>;

export const remotionExplainerStrategySchema = z.object({
  type: z.literal('remotion_explainer'),
  componentType: remotionExplainerComponentTypeSchema,
  header: explainerHeaderSchema.default({
    topicTag: 'SYSTEM DESIGN · 001',
    channelHandle: '@creatorflow',
    actNumber: '00',
    actTitle: 'OVERVIEW',
  }),
  props: z.record(z.string(), z.any()),
}).strict();
export type RemotionExplainerStrategy = z.infer<typeof remotionExplainerStrategySchema>;

export const explainerPropSchemas = {
  interview_question: interviewQuestionPropsSchema,
  database_transaction: databaseTransactionPropsSchema,
  cache_layer: cacheLayerPropsSchema,
  search_engine: searchEnginePropsSchema,
  geospatial_map: geospatialMapPropsSchema,
  system_architecture: systemArchitecturePropsSchema,
  kinetic_typography: kineticTypographyPropsSchema,
  flowchart: flowchartPropsSchema,
  comparison: comparisonPropsSchema,
  process_timeline: processTimelinePropsSchema,
  concept_breakdown: conceptBreakdownPropsSchema,
  statistics: statisticsPropsSchema,
  data_flow: dataFlowPropsSchema,
  ui_walkthrough: uiWalkthroughPropsSchema,
  network_diagram: networkDiagramPropsSchema,
  generic_infographic: genericInfographicPropsSchema,
} as const;

export function validateExplainerComponentProps(
  componentType: RemotionExplainerComponentType,
  props: unknown
): { success: true; data: any } | { success: false; error: string } {
  const schema = explainerPropSchemas[componentType];
  if (!schema) {
    return { success: false, error: `Unknown explainer component type: ${componentType}` };
  }
  const result = schema.safeParse(props);
  if (!result.success) {
    return { success: false, error: result.error.message };
  }
  return { success: true, data: result.data };
}

export const renderStrategySchema = z.discriminatedUnion('type', [
  motionGraphicsStrategySchema,
  procedural3DStrategySchema,
  uploadedMediaStrategySchema,
  aiImageStrategySchema,
  aiVideoStrategySchema,
  stockFootageStrategySchema,
  compositedSceneStrategySchema,
  remotionExplainerStrategySchema,
]);
export type RenderStrategy = z.infer<typeof renderStrategySchema>;
export type RenderStrategyType = RenderStrategy['type'];

export const sceneAudioSchema = z.object({
  narrationEnabled: z.boolean().default(true),
  text: z.string().trim().max(2000).optional(),
  language: z.enum(['hi', 'en', 'hinglish']).optional(),
  volume: z.number().min(0).max(1).default(1),
}).strict();
export type SceneAudio = z.infer<typeof sceneAudioSchema>;

export const textOverlaySchema = z.object({
  text: z.string().trim().min(1).max(120),
  position: z.enum(['top', 'center', 'bottom', 'lower_third']),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
}).strict();
export type TextOverlay = z.infer<typeof textOverlaySchema>;

export const universalSceneSchema = z.object({
  id: z.string().trim().min(1).max(64),
  sceneNumber: z.number().int().min(1).max(20),
  sceneType: z.string().trim().min(1).max(50).default('content'),
  durationSeconds: z.number().int().min(2).max(60),
  visualDescription: z.string().trim().min(1).max(1000),
  renderStrategy: renderStrategySchema,
  audio: sceneAudioSchema.default({ narrationEnabled: true, volume: 1 }),
  subtitles: z.array(subtitleItemSchema).default([]),
  textOverlays: z.array(textOverlaySchema).default([]),
  transition: transitionSchema.default('fade'),
}).strict();
export type UniversalScene = z.infer<typeof universalSceneSchema>;

export const universalScenePlanSchema = z.object({
  scenes: z.array(universalSceneSchema).min(1).max(20),
  totalDurationSeconds: z.number().int().min(10).max(180),
}).strict();
export type UniversalScenePlanData = z.infer<typeof universalScenePlanSchema>;

// Aliases for compatibility
export const plannedSceneSchema = universalSceneSchema;
export type PlannedScene = UniversalScene;
export const scenePlanSchema = universalScenePlanSchema;
export type ScenePlanData = UniversalScenePlanData;

export interface ProjectScenePlan extends UniversalScenePlanData {
  id: string;
  projectId: string;
  version: number;
  approved: boolean;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const updateScenePlanSchema = universalScenePlanSchema.extend({
  expectedVersion: z.number().int().min(1),
}).strict();
export type UpdateScenePlanInput = z.infer<typeof updateScenePlanSchema>;

// Universal Multitrack Timeline Model
export const timelineClipSchema = z.object({
  id: z.string(),
  sceneId: z.string(),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0),
  content: z.record(z.string(), z.any()),
}).strict();
export type TimelineClip = z.infer<typeof timelineClipSchema>;

export const timelineTrackTypeSchema = z.enum([
  'video', 'audio_narration', 'audio_music', 'audio_sfx', 'subtitles', 'overlays',
]);
export type TimelineTrackType = z.infer<typeof timelineTrackTypeSchema>;

export const timelineTrackSchema = z.object({
  trackId: z.string(),
  name: z.string(),
  type: timelineTrackTypeSchema,
  clips: z.array(timelineClipSchema),
}).strict();
export type TimelineTrack = z.infer<typeof timelineTrackSchema>;

export const universalTimelineSchema = z.object({
  projectId: z.string(),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']),
  totalDurationSeconds: z.number().min(0),
  tracks: z.array(timelineTrackSchema),
}).strict();
export type UniversalTimeline = z.infer<typeof universalTimelineSchema>;

// Media Engine Registry Declarations
export const engineCapabilities = [
  'motion_graphics', 'procedural_3d', 'media_composition', 'ai_video', 'ai_image', 'tts', 'audio_mixing',
] as const;
export const engineCapabilitySchema = z.enum(engineCapabilities);
export type EngineCapability = z.infer<typeof engineCapabilitySchema>;

export interface EngineInfo {
  id: string;
  name: string;
  capabilities: EngineCapability[];
  supportedStrategies: RenderStrategyType[];
  isAvailable: boolean;
  dependencies: string[];
}

// Production State Machine & Jobs
export const productionJobTypes = ['SCRIPT_GENERATION', 'SCENE_PLANNING'] as const;
export const productionJobTypeSchema = z.enum(productionJobTypes);
export type ProductionJobType = z.infer<typeof productionJobTypeSchema>;

export const productionJobStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const;
export const productionJobStatusSchema = z.enum(productionJobStatuses);
export type ProductionJobStatus = z.infer<typeof productionJobStatusSchema>;

export interface ProductionJob {
  id: string;
  projectId: string;
  jobType: ProductionJobType;
  status: ProductionJobStatus;
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionState {
  projectStatus: ProjectStatus;
  category: VideoCategory;
  hasScript: boolean;
  scriptApproved: boolean;
  scriptVersion?: number;
  hasScenePlan: boolean;
  scenePlanApproved: boolean;
  scenePlanVersion?: number;
  hasStoryboard?: boolean;
  storyboardApproved?: boolean;
  storyboardVersion?: number;
  activeJob?: ProductionJob;
}

// Complete Technical Explainer Storyboard
export const technicalExplainerSceneSchema = z.object({
  id: z.string().trim().min(1),
  sceneNumber: z.number().int().min(1),
  componentType: remotionExplainerComponentTypeSchema,
  durationSeconds: z.number().min(1).max(120),
  durationInFrames: z.number().int().min(30).optional(),
  narration: z.string().trim().default(''),
  narrationAudioUrl: z.string().optional(),
  subtitles: z.array(subtitleItemSchema).default([]),
  header: explainerHeaderSchema.default({
    topicTag: 'SYSTEM DESIGN · 001',
    channelHandle: '@creatorflow',
    actNumber: '00',
    actTitle: 'OVERVIEW',
  }),
  props: z.record(z.string(), z.any()),
}).strict();
export type TechnicalExplainerScene = z.infer<typeof technicalExplainerSceneSchema>;

export const technicalExplainerStoryboardSchema = z.object({
  topicId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: z.string().trim().default('system_design'),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
  fps: z.number().int().default(30),
  width: z.number().int().default(720),
  height: z.number().int().default(1280),
  scenes: z.array(technicalExplainerSceneSchema).min(1).max(25),
  totalDurationSeconds: z.number().min(2),
  totalDurationInFrames: z.number().int().min(60).optional(),
}).strict();
export type TechnicalExplainerStoryboard = z.infer<typeof technicalExplainerStoryboardSchema>;


// Workflow Engine & Persistent DAG Models
export const taskStates = [
  'pending', 'ready', 'queued', 'running',
  'awaiting_external_action', 'awaiting_approval',
  'completed', 'failed', 'retry_scheduled',
  'blocked', 'cancelled', 'skipped',
] as const;
export const taskStateSchema = z.enum(taskStates);
export type TaskState = z.infer<typeof taskStateSchema>;

export const productionTaskTypes = [
  'SCRIPT_GENERATION', 'SCRIPT_APPROVAL', 'STORYBOARD_GENERATION',
  'SCENE_PROMPT_OPTIMIZATION', 'VIDEO_GENERATION', 'AUDIO_NARRATION',
  'MUSIC_SELECTION', 'ASSET_INGESTION', 'ASSET_VALIDATION',
  'TIMELINE_ASSEMBLY', 'QUALITY_ASSURANCE', 'EXPORT',
] as const;
export const productionTaskTypeSchema = z.enum(productionTaskTypes);
export type ProductionTaskType = z.infer<typeof productionTaskTypeSchema>;

// Storyboard & Shot Planning
export const storyboardSceneSchema = z.object({
  sceneNumber: z.number().int().min(1).max(20),
  title: z.string().trim().min(1).max(100),
  durationSeconds: z.number().int().min(2).max(60),
  visualDescription: z.string().trim().min(5).max(1000),
  cameraMotion: z.string().trim().default('cinematic slow pan'),
  lighting: z.string().trim().default('natural cinematic lighting'),
  providerPrompt: z.string().trim().min(5).max(2000),
  negativePrompt: z.string().trim().max(1000).optional(),
  narrationText: z.string().trim().max(2000).optional(),
  narrationEnabled: z.boolean().default(true),
  suggestedProvider: z.string().trim().default('google_flow'),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']).default('9:16'),
}).strict();
export type StoryboardScene = z.infer<typeof storyboardSceneSchema>;

export const storyboardSchema = z.object({
  projectId: z.string(),
  title: z.string().trim().min(1).max(120),
  scenes: z.array(storyboardSceneSchema).min(1).max(20),
  totalDurationSeconds: z.number().int().min(5).max(180),
}).strict();
export type StoryboardData = z.infer<typeof storyboardSchema>;

export const updateStoryboardSchema = storyboardSchema.extend({
  expectedVersion: z.number().int().min(1),
}).strict();
export type UpdateStoryboardInput = z.infer<typeof updateStoryboardSchema>;

export interface ProjectStoryboard extends StoryboardData {
  id: string;
  version: number;
  approved: boolean;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Manual Handoff Input
export const handoffCompleteSchema = z.object({
  filePath: z.string().trim().min(1),
  durationSeconds: z.number().min(0.1).optional(),
  mimeType: z.string().default('video/mp4'),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
}).strict();
export type HandoffCompleteInput = z.infer<typeof handoffCompleteSchema>;

// Scene Invalidation / Partial Regeneration Input
export const regenerateSceneSchema = z.object({
  sceneId: z.string().trim().min(1),
}).strict();
export type RegenerateSceneInput = z.infer<typeof regenerateSceneSchema>;

// Manual Handoff Specification for External Video Generators (e.g. Google Flow, Runway)
export const manualHandoffSpecSchema = z.object({
  providerName: z.string(),
  providerUrl: z.string(),
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  parameters: z.record(z.string(), z.any()).default({}),
  instructions: z.array(z.string()).default([]),
}).strict();
export type ManualHandoffSpec = z.infer<typeof manualHandoffSpecSchema>;

// Production Task Schema (Executable Node in Workflow DAG)
export const productionTaskSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sceneId: z.string().optional(),
  type: productionTaskTypeSchema,
  name: z.string(),
  state: taskStateSchema.default('pending'),
  prerequisiteTaskIds: z.array(z.string()).default([]),
  providerId: z.string().optional(),
  mode: z.enum(['api', 'manual_handoff', 'local']).default('local'),
  inputPayload: z.record(z.string(), z.any()).default({}),
  outputPayload: z.record(z.string(), z.any()).optional(),
  idempotencyKey: z.string(),
  attempts: z.number().int().default(0),
  maxAttempts: z.number().int().default(3),
  error: z.string().optional(),
  manualHandoffSpec: manualHandoffSpecSchema.optional(),
  externalJobId: z.string().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
}).strict();
export type ProductionTask = z.infer<typeof productionTaskSchema>;

// Media Asset Metadata
export const assetValidationReportSchema = z.object({
  valid: z.boolean(),
  codec: z.string(),
  aspectRatioMatches: z.boolean(),
  hasAudio: z.boolean(),
  durationDiffSeconds: z.number(),
  issues: z.array(z.string()),
}).strict();
export type AssetValidationReport = z.infer<typeof assetValidationReportSchema>;

export const assetSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  sceneId: z.string().optional(),
  taskId: z.string(),
  provider: z.string(),
  type: z.enum(['video', 'audio', 'image', 'subtitle']),
  filePath: z.string(),
  mimeType: z.string(),
  durationSeconds: z.number().min(0),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  checksum: z.string(),
  isValidated: z.boolean().default(false),
  validationReport: assetValidationReportSchema.optional(),
  createdAt: z.string(),
}).strict();
export type Asset = z.infer<typeof assetSchema>;

// Deterministic Quality Assurance Result
export const qaOutcomeSchema = z.enum(['PASSED', 'PASSED_WITH_WARNINGS', 'REQUIRES_REVIEW', 'FAILED']);
export type QaOutcome = z.infer<typeof qaOutcomeSchema>;

export const qaCheckItemSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  details: z.string(),
}).strict();
export type QaCheckItem = z.infer<typeof qaCheckItemSchema>;

export const qaResultSchema = z.object({
  projectId: z.string(),
  passed: z.boolean(),
  outcome: qaOutcomeSchema.default('PASSED'),
  checks: z.array(qaCheckItemSchema),
  warnings: z.array(z.string()).default([]),
  timestamp: z.string(),
}).strict();
export type QaResult = z.infer<typeof qaResultSchema>;

// Timeline Manifest & Synchronization Engine Models
export const timelineSceneSyncSchema = z.object({
  sceneNumber: z.number().int(),
  videoAssetId: z.string(),
  videoOriginalDuration: z.number(),
  audioAssetId: z.string().optional(),
  audioDuration: z.number().default(0),
  videoAdjustment: z.enum(['none', 'trim', 'speed_up', 'slow_down', 'hold_frame']),
  speedFactor: z.number().default(1.0),
  finalDuration: z.number(),
  subtitlePath: z.string().optional(),
}).strict();
export type TimelineSceneSync = z.infer<typeof timelineSceneSyncSchema>;

export const timelineManifestSchema = z.object({
  projectId: z.string(),
  aspectRatio: z.enum(['9:16', '16:9', '1:1']),
  totalDuration: z.number(),
  scenes: z.array(timelineSceneSyncSchema),
  backgroundMusic: z.object({
    assetId: z.string(),
    volume: z.number().default(0.15),
    ducking: z.boolean().default(true),
  }).optional(),
  createdAt: z.string(),
}).strict();
export type TimelineManifest = z.infer<typeof timelineManifestSchema>;

