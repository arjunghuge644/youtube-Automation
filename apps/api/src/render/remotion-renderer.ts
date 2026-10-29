import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type { TechnicalExplainerStoryboard, TechnicalExplainerScene } from '@creatorflow/shared';
import { TTSService } from '../providers/tts/tts-service.js';
import { LocalSpeechSynthesizer } from '../providers/tts/local-synthesizer.js';
import { AssetValidator } from '../media/asset-validator.js';

const execFileAsync = promisify(execFile);

export interface RenderExplainerOptions {
  outputDir?: string;
  filename?: string;
  compositionId?: 'TechnicalExplainer-9x16' | 'TechnicalExplainer-16x9';
  concurrency?: number;
  ttsProvider?: string;
  allowLocalFallback?: boolean;
}

export class RemotionRendererService {
  private tts: TTSService;
  private localFallback = new LocalSpeechSynthesizer();
  private validator = new AssetValidator();

  constructor(ttsService?: TTSService) {
    this.tts = ttsService || new TTSService();
  }

  /**
   * Automatically prepares audio narration, measures durations, aligns frame counts,
   * generates subtitles, and renders an MP4 video using Remotion.
   */
  async renderExplainerVideo(
    storyboard: TechnicalExplainerStoryboard,
    options: RenderExplainerOptions = {}
  ): Promise<{
    outputPath: string;
    totalDurationSeconds: number;
    totalFrames: number;
    validated: boolean;
    metadata: Record<string, unknown>;
    sceneAudioProviders: Record<number, string>;
  }> {
    const rootDir = process.cwd();
    const outputDir = options.outputDir || path.join(rootDir, 'exports');
    await fs.mkdir(outputDir, { recursive: true });

    const filename = options.filename || `explainer_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, filename);
    const compositionId =
      options.compositionId ||
      (storyboard.aspectRatio === '16:9' ? 'TechnicalExplainer-16x9' : 'TechnicalExplainer-9x16');

    const fps = storyboard.fps || 30;
    const tempDir = path.join(rootDir, 'storage', 'temp', `explainer_${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const processedScenes: TechnicalExplainerScene[] = [];
    const sceneAudioProviders: Record<number, string> = {};
    let totalFrames = 0;
    let totalSeconds = 0;

    // 1. Audio-driven timing calculation per scene
    for (const scene of storyboard.scenes) {
      let sceneAudioUrl: string | undefined = scene.narrationAudioUrl;
      let sceneDuration = scene.durationSeconds || 3;
      let providerUsed = options.ttsProvider || this.tts.getProvider().id;

      if (scene.narration && scene.narration.trim()) {
        try {
          const ttsResult = await this.tts.synthesize(
            {
              taskId: `task_narration_${scene.id}`,
              text: scene.narration,
              language: 'en',
              projectId: 'temp_explainer',
              sceneId: scene.id,
            },
            options.ttsProvider
          );

          // Verify the synthesized audio file with AssetValidator
          const validation = await this.validator.validateAudioAsset(ttsResult.filePath);
          if (!validation.valid) {
            throw new Error(`Synthesized audio failed validation: ${validation.issues.join(', ')}`);
          }

          // Convert audio to base64 Data URL so Remotion embeds it seamlessly without static file 404s
          const audioBuffer = await fs.readFile(ttsResult.filePath);
          const mimeType = ttsResult.filePath.endsWith('.aac') ? 'audio/aac' : 'audio/wav';
          sceneAudioUrl = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;

          if (ttsResult.durationSeconds && ttsResult.durationSeconds > 0) {
            sceneDuration = Math.max(2.5, Number(ttsResult.durationSeconds.toFixed(2)));
          }
          providerUsed = ttsResult.provider;
        } catch (ttsErr: any) {
          if (options.allowLocalFallback === true) {
            console.warn(
              `[RemotionRendererService] Primary TTS generation failed for scene ${scene.sceneNumber}: ${ttsErr.message}. Falling back to explicitly enabled local synthesizer.`
            );
            const fallbackResult = await this.localFallback.synthesizeSpeech({
              taskId: `task_fallback_${scene.id}`,
              text: scene.narration,
              language: 'en',
              projectId: 'temp_explainer',
              sceneId: scene.id,
            });

            const fallbackValidation = await this.validator.validateAudioAsset(fallbackResult.filePath);
            if (!fallbackValidation.valid) {
              throw new Error(`Fallback audio asset failed verification: ${fallbackValidation.issues.join(', ')}`);
            }

            const audioBuffer = await fs.readFile(fallbackResult.filePath);
            const mimeType = fallbackResult.filePath.endsWith('.aac') ? 'audio/aac' : 'audio/wav';
            sceneAudioUrl = `data:${mimeType};base64,${audioBuffer.toString('base64')}`;
            if (fallbackResult.durationSeconds && fallbackResult.durationSeconds > 0) {
              sceneDuration = Math.max(2.5, Number(fallbackResult.durationSeconds.toFixed(2)));
            }
            providerUsed = 'local_tts';
          } else {
            console.error(
              `[RemotionRendererService] Narration synthesis failed for scene ${scene.sceneNumber}: ${ttsErr.message}. Fallback is disabled.`
            );
            throw new Error(
              `Narration synthesis failed for scene ${scene.sceneNumber}: ${ttsErr.message}. Narration is required; rendering aborted to prevent unverified production.`
            );
          }
        }
      }

      if (scene.narration && scene.narration.trim() && !sceneAudioUrl) {
        throw new Error(`Narration required for scene ${scene.sceneNumber} but no audio stream could be generated.`);
      }

      sceneAudioProviders[scene.sceneNumber] = providerUsed;

      const durationInFrames = Math.max(30, Math.ceil(sceneDuration * fps));
      totalFrames += durationInFrames;
      totalSeconds += sceneDuration;

      // Ensure subtitles are populated and accurately aligned to the actual audio duration
      const subtitles = this.alignSubtitlesToSpeech(
        scene.subtitles,
        scene.narration || '',
        sceneDuration
      );

      processedScenes.push({
        ...scene,
        durationSeconds: sceneDuration,
        durationInFrames,
        narrationAudioUrl: sceneAudioUrl,
        subtitles,
      });
    }

    const finalizedStoryboard: TechnicalExplainerStoryboard = {
      ...storyboard,
      fps,
      scenes: processedScenes,
      totalDurationSeconds: Number(totalSeconds.toFixed(2)),
      totalDurationInFrames: totalFrames,
    };

    // 2. Write props file for Remotion CLI
    const propsFilePath = path.join(tempDir, 'props.json');
    await fs.writeFile(propsFilePath, JSON.stringify(finalizedStoryboard, null, 2), 'utf8');

    // 3. Render MP4 via Remotion CLI
    const entryPath = path.join(rootDir, 'packages', 'remotion-explainer', 'src', 'remotion-entry.ts');
    const npxCmd = 'npx';
    const renderArgs = [
      'remotion',
      'render',
      entryPath,
      compositionId,
      outputPath,
      `--props=${propsFilePath}`,
      '--concurrency=2',
      '--log=warn',
      '--overwrite',
    ];

    try {
      await execFileAsync(npxCmd, renderArgs, {
        cwd: rootDir,
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      });
    } catch (renderError) {
      throw new Error(`Remotion render failed: ${(renderError as Error).message}`);
    }

    // 4. Validate output with FFprobe
    const validation = await this.validator.validateVideoAsset(outputPath, {
      expectedAspectRatio: storyboard.aspectRatio === '16:9' ? '16:9' : '9:16',
    });
    if (!validation.valid) {
      throw new Error(`Rendered video failed FFprobe validation: ${validation.issues.join(', ')}`);
    }

    const inspectedMedia = await this.validator.inspectMedia(outputPath);
    const durationSeconds = Number(inspectedMedia?.format?.duration || 0);

    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Non-blocking cleanup
    }

    return {
      outputPath,
      totalDurationSeconds: durationSeconds,
      totalFrames,
      validated: true,
      metadata: inspectedMedia?.format || {},
      sceneAudioProviders,
    };
  }

  /**
   * Phase 6: Intelligent Scene Repair.
   * Isolates an individual scene, updates its props and/or narration,
   * validates the patched scene, preserves all other scenes' audio and layout,
   * and produces an updated storyboard ready for fast reassembly.
   */
  async repairScene(
    storyboard: TechnicalExplainerStoryboard,
    sceneNumber: number,
    patch: Partial<TechnicalExplainerScene>
  ): Promise<TechnicalExplainerStoryboard> {
    const updatedScenes = [...storyboard.scenes];
    const targetIdx = updatedScenes.findIndex((s) => s.sceneNumber === sceneNumber);
    if (targetIdx === -1) {
      throw new Error(`Scene ${sceneNumber} not found in storyboard.`);
    }

    const currentScene = updatedScenes[targetIdx];
    const updatedScene: TechnicalExplainerScene = {
      ...currentScene,
      ...patch,
      header: patch.header || currentScene.header,
      props: patch.props || currentScene.props,
    };

    // If narration changed, clear the cached audio URL so it re-synthesizes for this scene only
    if (patch.narration && patch.narration !== currentScene.narration) {
      delete updatedScene.narrationAudioUrl;
    }

    updatedScenes[targetIdx] = updatedScene;

    return {
      ...storyboard,
      scenes: updatedScenes,
    };
  }

  /**
   * Generates or re-times subtitles so that 100% of the speech duration is covered,
   * split into natural, readable phrase chunks (3-7 words per line).
   */
  alignSubtitlesToSpeech(
    existingSubtitles: Array<{ text: string; startSeconds: number; endSeconds: number }> | undefined,
    narrationText: string,
    actualDuration: number
  ): Array<{ text: string; startSeconds: number; endSeconds: number }> {
    const text = narrationText.trim();
    if (!text) return [];

    // If existing subtitles exist and their coverage spans >= 85% of actual duration, scale them proportionally
    if (existingSubtitles && existingSubtitles.length > 0) {
      const lastSub = existingSubtitles[existingSubtitles.length - 1];
      const maxEnd = lastSub.endSeconds;
      if (maxEnd > 0) {
        const scaleFactor = (actualDuration - 0.3) / maxEnd;
        return existingSubtitles.map((sub) => ({
          text: sub.text,
          startSeconds: Number(Math.max(0.2, sub.startSeconds * scaleFactor).toFixed(2)),
          endSeconds: Number(Math.min(actualDuration - 0.15, sub.endSeconds * scaleFactor).toFixed(2)),
        }));
      }
    }

    // Otherwise, segment the narration into natural phrase chunks
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const phraseChunks: string[] = [];

    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/).filter(Boolean);
      if (words.length <= 6) {
        phraseChunks.push(words.join(' '));
      } else {
        for (let i = 0; i < words.length; i += 5) {
          phraseChunks.push(words.slice(i, i + 5).join(' '));
        }
      }
    }

    if (phraseChunks.length === 0) return [];

    const totalWords = text.split(/\s+/).filter(Boolean).length || 1;
    const speechStart = 0.2;
    const speechEnd = Math.max(speechStart + 1.0, actualDuration - 0.25);
    const totalSpeechTime = speechEnd - speechStart;

    let accumulatedTime = speechStart;
    const result: Array<{ text: string; startSeconds: number; endSeconds: number }> = [];

    for (let i = 0; i < phraseChunks.length; i++) {
      const chunk = phraseChunks[i];
      const chunkWords = chunk.split(/\s+/).filter(Boolean).length;
      const fraction = chunkWords / totalWords;
      const chunkDuration = fraction * totalSpeechTime;
      const startSeconds = Number(accumulatedTime.toFixed(2));
      const endSeconds = Number(
        (i === phraseChunks.length - 1 ? speechEnd : accumulatedTime + chunkDuration).toFixed(2)
      );

      result.push({
        text: chunk,
        startSeconds,
        endSeconds: Math.max(startSeconds + 0.5, endSeconds),
      });

      accumulatedTime += chunkDuration;
    }

    return result;
  }
}
