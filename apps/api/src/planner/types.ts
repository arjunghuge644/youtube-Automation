import type { Project, ScriptData, UniversalScenePlanData, StoryboardData } from '@creatorflow/shared';

export interface Planner {
  generateScript(project: Project): Promise<ScriptData>;
  generateScenePlan(project: Project, script: ScriptData): Promise<UniversalScenePlanData>;
  generateStoryboard(project: Project, script: ScriptData): Promise<StoryboardData>;
}
