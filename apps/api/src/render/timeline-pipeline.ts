import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Project, UniversalScenePlanData, TechnicalExplainerStoryboard } from '@creatorflow/shared';
import { RemotionRendererService } from './remotion-renderer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RENDERER_SCRIPT = path.join(__dirname, 'procedural_renderer.py');

export interface RenderPipelineOptions {
  outputPath?: string;
  fps?: number;
}

export class TimelinePipeline {
  async renderVideo(
    project: Project,
    scenePlan: UniversalScenePlanData,
    options: RenderPipelineOptions = {},
  ): Promise<string> {
    const exportsDir = path.resolve(process.cwd(), 'exports');
    await fs.mkdir(exportsDir, { recursive: true });

    const safeTitle = (project.title || 'video')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${safeTitle}_${project.aspectRatio.replace(':', 'x')}_v${project.version || 1}.mp4`;
    const outputPath = options.outputPath || path.join(exportsDir, filename);

    // If technical explainer, delegate to RemotionRendererService
    const hasExplainerScenes = scenePlan.scenes.some(
      (s) => s.renderStrategy.type === 'remotion_explainer'
    );

    if (hasExplainerScenes || project.visualStyle === 'technical_explainer') {
      const remotionService = new RemotionRendererService();
      const isLandscape = project.aspectRatio === '16:9';

      const storyboard: TechnicalExplainerStoryboard = {
        topicId: project.title,
        title: project.title,
        category: 'system_design',
        aspectRatio: isLandscape ? '16:9' : '9:16',
        fps: options.fps || 30,
        width: isLandscape ? 1920 : 720,
        height: isLandscape ? 1080 : 1280,
        scenes: scenePlan.scenes.map((s) => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          componentType:
            s.renderStrategy.type === 'remotion_explainer'
              ? (s.renderStrategy as any).componentType
              : 'kinetic_typography',
          durationSeconds: s.durationSeconds,
          narration: s.audio?.text || s.visualDescription,
          subtitles: s.subtitles || [],
          header:
            s.renderStrategy.type === 'remotion_explainer' && (s.renderStrategy as any).header
              ? (s.renderStrategy as any).header
              : {
                  topicTag: project.title.toUpperCase(),
                  channelHandle: '@creatorflow',
                  actNumber: String(s.sceneNumber).padStart(2, '0'),
                  actTitle: s.sceneType.toUpperCase(),
                },
          props:
            s.renderStrategy.type === 'remotion_explainer'
              ? (s.renderStrategy as any).props
              : {},
        })),
        totalDurationSeconds: scenePlan.totalDurationSeconds,
      };

      const result = await remotionService.renderExplainerVideo(storyboard, {
        outputDir: exportsDir,
        filename,
        compositionId: isLandscape ? 'TechnicalExplainer-16x9' : 'TechnicalExplainer-9x16',
      });
      return result.outputPath;
    }

    // Default procedural python/ffmpeg renderer
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'creatorflow-render-'));
    const projectPath = path.join(tempDir, 'project.json');
    const scenePlanPath = path.join(tempDir, 'scene_plan.json');

    try {
      await fs.writeFile(projectPath, JSON.stringify(project), 'utf-8');
      await fs.writeFile(scenePlanPath, JSON.stringify(scenePlan), 'utf-8');

      await new Promise<void>((resolve, reject) => {
        const proc = spawn('python3', [RENDERER_SCRIPT, projectPath, scenePlanPath, outputPath], {
          stdio: ['ignore', 'inherit', 'inherit'],
        });

        proc.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Render process exited with code ${code}`));
        });

        proc.on('error', (err) => reject(err));
      });

      return outputPath;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

