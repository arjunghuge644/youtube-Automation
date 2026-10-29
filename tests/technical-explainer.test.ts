import { describe, it, expect } from 'vitest';
import {
  technicalExplainerStoryboardSchema,
  remotionExplainerStrategySchema,
  type Project,
} from '@creatorflow/shared';
import { TechnicalExplainerPlanner } from '../apps/api/src/planner/explainer-planner.js';
import { CreativeDirector } from '../apps/api/src/planner/creative-director.js';

describe('Technical Explainer System & Remotion Component Library', () => {
  const planner = new TechnicalExplainerPlanner();
  const director = new CreativeDirector();

  it('transforms food app system design prompt into structured storyboard selecting trusted components', async () => {
    const storyboard = await planner.planStoryboard(
      'Interviewer: Build a food app like Swiggy or Zomato. Which database do you choose?',
      { aspectRatio: '9:16' }
    );

    expect(storyboard.topicId).toBeDefined();
    expect(storyboard.aspectRatio).toBe('9:16');
    expect(storyboard.scenes.length).toBeGreaterThanOrEqual(5);

    // Verify all component types are strictly trusted Remotion components
    const trustedTypes = new Set([
      'interview_question',
      'database_transaction',
      'cache_layer',
      'search_engine',
      'geospatial_map',
      'system_architecture',
      'kinetic_typography',
    ]);

    for (const scene of storyboard.scenes) {
      expect(trustedTypes.has(scene.componentType)).toBe(true);
      expect(scene.durationSeconds).toBeGreaterThan(0);
      expect(scene.props).toBeDefined();
      expect(scene.header).toBeDefined();
    }

    // Must validate strictly against Zod schema
    const validated = technicalExplainerStoryboardSchema.safeParse(storyboard);
    expect(validated.success).toBe(true);
  });

  it('transforms distributed rate limiter prompt into structured storyboard without hardcoded Swiggy/Zomato', async () => {
    const storyboard = await planner.planStoryboard(
      'Design a high-throughput distributed rate limiter handling 100k requests per second with Redis sliding window and token bucket',
      { aspectRatio: '16:9' }
    );

    expect(storyboard.aspectRatio).toBe('16:9');
    expect(storyboard.title).toContain('Rate Limiter');

    // Verify component diversity
    const sceneTypes = storyboard.scenes.map((s) => s.componentType);
    expect(sceneTypes).toContain('interview_question');
    expect(sceneTypes).toContain('database_transaction');
    expect(sceneTypes).toContain('cache_layer');
    expect(sceneTypes).toContain('system_architecture');
    expect(sceneTypes).toContain('kinetic_typography');

    const validated = technicalExplainerStoryboardSchema.safeParse(storyboard);
    expect(validated.success).toBe(true);
  });

  it('CreativeDirector detects technical explainer requests and compiles remotion_explainer strategies', async () => {
    const project: Project = {
      id: 'proj_tech_101',
      ownerId: 'user_1',
      title: 'Zomato Food App Database Design',
      prompt: 'Swiggy ya Zomato jaisa food app banao. Database kaunsa lagaoge?',
      category: 'educational',
      language: 'en',
      durationSeconds: 21,
      aspectRatio: '9:16',
      visualStyle: 'technical_explainer',
      narrationStyle: 'documentary',
      narrationEnabled: true,
      audience: 'Backend Engineers',
      resolution: '720p',
      status: 'DRAFT',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(director.isTechnicalExplainer(project)).toBe(true);

    const script = await director.generateScript(project);
    expect(script.scenes.length).toBeGreaterThanOrEqual(5);

    const scenePlan = await director.generateScenePlan(project, script);
    expect(scenePlan.scenes.length).toBeGreaterThanOrEqual(5);

    for (const scene of scenePlan.scenes) {
      expect(scene.renderStrategy.type).toBe('remotion_explainer');
      const validStrategy = remotionExplainerStrategySchema.safeParse(scene.renderStrategy);
      expect(validStrategy.success).toBe(true);
    }
  });
});

