import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Project, UniversalScenePlanData } from '@creatorflow/shared';

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

    // Create temp files for inputs
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

