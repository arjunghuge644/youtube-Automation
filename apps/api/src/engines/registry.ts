import type {
  EngineCapability,
  EngineInfo,
  RenderStrategyType,
  UniversalScene,
} from '@creatorflow/shared';

export interface ResourceEstimate {
  estimatedTimeSeconds: number;
  memoryMb: number;
}

export interface MediaEngine {
  readonly id: string;
  readonly name: string;
  readonly capabilities: EngineCapability[];
  readonly supportedStrategies: RenderStrategyType[];
  readonly dependencies: string[];
  isAvailable(): Promise<boolean>;
  estimateCost(scene: UniversalScene): ResourceEstimate;
}

export class MediaEngineRegistry {
  private engines = new Map<string, MediaEngine>();

  register(engine: MediaEngine): void {
    this.engines.set(engine.id, engine);
  }

  get(id: string): MediaEngine | undefined {
    return this.engines.get(id);
  }

  findByStrategy(strategy: RenderStrategyType): MediaEngine[] {
    return Array.from(this.engines.values()).filter((e) =>
      e.supportedStrategies.includes(strategy),
    );
  }

  async listEngines(): Promise<EngineInfo[]> {
    const list: EngineInfo[] = [];
    for (const engine of this.engines.values()) {
      list.push({
        id: engine.id,
        name: engine.name,
        capabilities: engine.capabilities,
        supportedStrategies: engine.supportedStrategies,
        isAvailable: await engine.isAvailable(),
        dependencies: engine.dependencies,
      });
    }
    return list;
  }
}

// Built-in Engines
export class MotionGraphicsEngine implements MediaEngine {
  readonly id = 'engine_motion_graphics';
  readonly name = 'Motion Graphics & Kinetic Typography Engine';
  readonly capabilities: EngineCapability[] = ['motion_graphics'];
  readonly supportedStrategies: RenderStrategyType[] = ['motion_graphics'];
  readonly dependencies = ['Canvas', 'SVG'];

  async isAvailable(): Promise<boolean> {
    return true; // Local built-in renderer
  }

  estimateCost(scene: UniversalScene): ResourceEstimate {
    return { estimatedTimeSeconds: Math.max(1, scene.durationSeconds * 0.2), memoryMb: 128 };
  }
}

export class Procedural3DEngine implements MediaEngine {
  readonly id = 'engine_procedural_3d';
  readonly name = 'Procedural 3D Simulation Engine';
  readonly capabilities: EngineCapability[] = ['procedural_3d'];
  readonly supportedStrategies: RenderStrategyType[] = ['procedural_3d'];
  readonly dependencies = ['Three.js', 'WebGL/HeadlessGL'];

  private templates = new Set(['traffic_intersection']);

  registerTemplate(templateId: string): void {
    this.templates.add(templateId);
  }

  hasTemplate(templateId: string): boolean {
    return this.templates.has(templateId);
  }

  async isAvailable(): Promise<boolean> {
    return true; // Local procedural Three.js engine
  }

  estimateCost(scene: UniversalScene): ResourceEstimate {
    return { estimatedTimeSeconds: Math.max(2, scene.durationSeconds * 0.5), memoryMb: 256 };
  }
}

export class CompositedMediaEngine implements MediaEngine {
  readonly id = 'engine_composited_media';
  readonly name = 'Media Composition & Ken Burns Engine';
  readonly capabilities: EngineCapability[] = ['media_composition'];
  readonly supportedStrategies: RenderStrategyType[] = ['uploaded_media', 'stock_footage', 'composited_scene'];
  readonly dependencies = ['FFmpeg', 'Sharp'];

  async isAvailable(): Promise<boolean> {
    return true; // Local compositing engine
  }

  estimateCost(scene: UniversalScene): ResourceEstimate {
    return { estimatedTimeSeconds: Math.max(1, scene.durationSeconds * 0.3), memoryMb: 192 };
  }
}

export class GenerativeVideoAdapter implements MediaEngine {
  readonly id = 'engine_generative_video';
  readonly name = 'Generative AI Video Adapter';
  readonly capabilities: EngineCapability[] = ['ai_video'];
  readonly supportedStrategies: RenderStrategyType[] = ['ai_video'];
  readonly dependencies = ['External AI Provider API'];

  constructor(private apiKeyConfigured = false) {}

  async isAvailable(): Promise<boolean> {
    return this.apiKeyConfigured;
  }

  estimateCost(scene: UniversalScene): ResourceEstimate {
    return { estimatedTimeSeconds: scene.durationSeconds * 4, memoryMb: 512 };
  }
}

export class GenerativeImageAdapter implements MediaEngine {
  readonly id = 'engine_generative_image';
  readonly name = 'Generative AI Image Adapter';
  readonly capabilities: EngineCapability[] = ['ai_image'];
  readonly supportedStrategies: RenderStrategyType[] = ['ai_image'];
  readonly dependencies = ['External AI Provider API'];

  constructor(private apiKeyConfigured = false) {}

  async isAvailable(): Promise<boolean> {
    return this.apiKeyConfigured;
  }

  estimateCost(scene: UniversalScene): ResourceEstimate {
    return { estimatedTimeSeconds: scene.durationSeconds * 2, memoryMb: 256 };
  }
}

export function createDefaultEngineRegistry(): MediaEngineRegistry {
  const registry = new MediaEngineRegistry();
  registry.register(new MotionGraphicsEngine());
  registry.register(new Procedural3DEngine());
  registry.register(new CompositedMediaEngine());
  registry.register(new GenerativeVideoAdapter(false));
  registry.register(new GenerativeImageAdapter(false));
  return registry;
}

