import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  Project,
  StoryboardData,
  Asset,
  TimelineManifest,
} from '@creatorflow/shared';

const execFileAsync = promisify(execFile);

export interface AssembleOptions {
  outputPath?: string;
  burnSubtitles?: boolean;
  subtitleSrtPath?: string;
  backgroundMusicPath?: string;
  backgroundMusicVolume?: number;
}

export class TimelineAssembler {
  /**
   * Determine target pixel resolution based on project aspect ratio.
   */
  getTargetDimensions(aspectRatio: '9:16' | '16:9' | '1:1'): { width: number; height: number } {
    switch (aspectRatio) {
      case '16:9':
        return { width: 1920, height: 1080 };
      case '1:1':
        return { width: 1080, height: 1080 };
      case '9:16':
      default:
        return { width: 1080, height: 1920 };
    }
  }

  /**
   * Assemble complete normalized video production from manifest and assets.
   */
  async assemble(context: {
    project: Project;
    storyboard: StoryboardData;
    manifest: TimelineManifest;
    videoAssets: Asset[];
    audioAssets?: Asset[];
    options?: AssembleOptions;
  }): Promise<{ outputPath: string; durationSeconds: number }> {
    const {
      project,
      manifest,
      videoAssets,
      audioAssets = [],
      options = {},
    } = context;

    const exportsDir = path.resolve(process.cwd(), 'storage', 'projects', project.id, 'exports');
    await fs.mkdir(exportsDir, { recursive: true });

    const safeTitle = (project.title || 'creatorflow_production')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const filename = `${safeTitle}_${manifest.aspectRatio.replace(':', 'x')}_final.mp4`;
    const finalOutputPath = options.outputPath || path.join(exportsDir, filename);

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cf-assemble-'));
    const { width, height } = this.getTargetDimensions(manifest.aspectRatio);

    try {
      const normalizedSceneFiles: string[] = [];

      // Step 1: Normalize & synchronize each scene
      for (const sceneSync of manifest.scenes) {
        const sceneNum = sceneSync.sceneNumber;
        const videoAsset = videoAssets.find((a) => a.id === sceneSync.videoAssetId);
        if (!videoAsset) {
          throw new Error(`Assembly failed: Video asset for scene ${sceneNum} not found.`);
        }

        const audioAsset = sceneSync.audioAssetId
          ? audioAssets.find((a) => a.id === sceneSync.audioAssetId)
          : undefined;

        const sceneOutPath = path.join(tempDir, `norm_scene_${sceneNum}.mp4`);

        // Video filter: scale, pad to project aspect ratio, set SAR=1, 30fps
        const videoFilters: string[] = [
          `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
          `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
          `setsar=1`,
          `fps=30`,
        ];

        // Apply video adjustment
        if (sceneSync.videoAdjustment === 'trim') {
          // trim handled via -t parameter
        } else if (sceneSync.videoAdjustment === 'slow_down' && sceneSync.speedFactor < 1.0) {
          const ptsMultiplier = (1 / sceneSync.speedFactor).toFixed(4);
          videoFilters.push(`setpts=${ptsMultiplier}*PTS`);
        } else if (sceneSync.videoAdjustment === 'hold_frame') {
          const holdSeconds = Math.max(0.1, sceneSync.finalDuration - sceneSync.videoOriginalDuration);
          videoFilters.push(`tpad=stop_mode=clone:stop_duration=${holdSeconds.toFixed(2)}`);
        }

        const ffmpegArgs: string[] = [
          '-y',
          '-i', path.resolve(videoAsset.filePath),
        ];

        // Attach narration audio or generate silence for scene duration
        if (audioAsset) {
          ffmpegArgs.push('-i', path.resolve(audioAsset.filePath));
          ffmpegArgs.push(
            '-filter_complex',
            `[0:v]${videoFilters.join(',')}[v];[1:a]apad=whole_dur=${sceneSync.finalDuration}[a]`,
            '-map', '[v]',
            '-map', '[a]',
          );
        } else {
          // Generate silent audio channel matching video duration
          ffmpegArgs.push(
            '-f', 'lavfi',
            '-i', `aevalsrc=0:d=${sceneSync.finalDuration}:s=44100`,
            '-filter_complex',
            `[0:v]${videoFilters.join(',')}[v];[1:a]apad=whole_dur=${sceneSync.finalDuration}[a]`,
            '-map', '[v]',
            '-map', '[a]',
          );
        }

        ffmpegArgs.push(
          '-t', String(sceneSync.finalDuration),
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '20',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-ar', '44100',
          sceneOutPath,
        );

        await execFileAsync('ffmpeg', ffmpegArgs);
        normalizedSceneFiles.push(sceneOutPath);
      }

      // Step 2: Concat normalized scenes
      const concatListPath = path.join(tempDir, 'concat_list.txt');
      const concatContent = normalizedSceneFiles
        .map((p) => `file '${p}'`)
        .join('\n');
      await fs.writeFile(concatListPath, concatContent, 'utf-8');

      const stitchedPath = path.join(tempDir, 'stitched.mp4');
      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        stitchedPath,
      ]);

      // Step 3: Burn subtitles & apply broadcast audio normalization
      const finalPassArgs: string[] = [
        '-y',
        '-i', stitchedPath,
      ];

      const filterChains: string[] = [];

      if (options.burnSubtitles && options.subtitleSrtPath) {
        // Escape path for ffmpeg subtitles filter (escape colons and backslashes)
        const escapedSrtPath = options.subtitleSrtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
        filterChains.push(
          `subtitles='${escapedSrtPath}':force_style='FontSize=16,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,MarginV=35'`,
        );
      }

      if (filterChains.length > 0) {
        finalPassArgs.push('-vf', filterChains.join(','));
      } else {
        finalPassArgs.push('-c:v', 'copy');
      }

      finalPassArgs.push(
        '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11',
        '-c:a', 'aac',
        '-b:a', '192k',
        finalOutputPath,
      );

      await execFileAsync('ffmpeg', finalPassArgs);

      return {
        outputPath: finalOutputPath,
        durationSeconds: manifest.totalDuration,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
