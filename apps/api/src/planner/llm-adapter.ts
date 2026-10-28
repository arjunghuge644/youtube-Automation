import type { Project, ScriptData, UniversalScenePlanData, StoryboardData } from '@creatorflow/shared';
import type { Planner } from './types.js';
import { CreativeDirector } from './creative-director.js';

export interface LlmAdapterConfig {
  apiKey?: string;
  provider?: 'local' | 'gemini';
  model?: string;
}

export class ReplaceableLlmPlanner implements Planner {
  private creativeDirector = new CreativeDirector();

  constructor(private config: LlmAdapterConfig = {}) {}

  async generateScript(project: Project): Promise<ScriptData> {
    if (this.config.provider === 'gemini' && this.config.apiKey) {
      try {
        return await this.callGeminiForScript(project);
      } catch (error) {
        console.warn(`[ReplaceableLlmPlanner] Gemini generation failed; falling back to Creative Director. Error: ${(error as Error).message}`);
      }
    }
    return this.creativeDirector.generateScript(project);
  }

  async generateScenePlan(project: Project, script: ScriptData): Promise<UniversalScenePlanData> {
    if (this.config.provider === 'gemini' && this.config.apiKey) {
      try {
        return await this.callGeminiForScenePlan(project, script);
      } catch (error) {
        console.warn(`[ReplaceableLlmPlanner] Gemini scene planning failed; falling back to Creative Director. Error: ${(error as Error).message}`);
      }
    }
    return this.creativeDirector.generateScenePlan(project, script);
  }

  async generateStoryboard(project: Project, script: ScriptData): Promise<StoryboardData> {
    return this.creativeDirector.generateStoryboard(project, script);
  }

  private async callGeminiForScript(_project: Project): Promise<ScriptData> {
    throw new Error('External LLM provider call is not authorized in current environment.');
  }

  private async callGeminiForScenePlan(_project: Project, _script: ScriptData): Promise<UniversalScenePlanData> {
    throw new Error('External LLM provider call is not authorized in current environment.');
  }
}

export function createPlanner(config: LlmAdapterConfig = {}): Planner {
  return new ReplaceableLlmPlanner(config);
}
