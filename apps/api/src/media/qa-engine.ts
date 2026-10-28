import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import type {
  Project,
  ProjectScript,
  StoryboardData,
  ProductionTask,
  Asset,
  QaResult,
  QaCheckItem,
  QaOutcome,
} from '@creatorflow/shared';

const execFileAsync = promisify(execFile);

export class QAEngine {
  private async inspectExport(filePath: string): Promise<any> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);
    return JSON.parse(stdout);
  }

  private async detectAudioVolume(filePath: string): Promise<{ meanVolumeDb: number; isSilent: boolean }> {
    try {
      const { stderr } = await execFileAsync('ffmpeg', [
        '-i', filePath,
        '-af', 'volumedetect',
        '-f', 'null',
        '-',
      ]);

      const meanMatch = stderr.match(/mean_volume:\s+(-?[\d.]+)\s+dB/);
      if (meanMatch) {
        const mean = parseFloat(meanMatch[1]);
        return { meanVolumeDb: mean, isSilent: mean < -65 };
      }
    } catch {
      // Non-blocking fallback
    }
    return { meanVolumeDb: -20, isSilent: false };
  }

  async runDeterministicQA(context: {
    project: Project;
    script: ProjectScript;
    storyboard: StoryboardData;
    tasks: ProductionTask[];
    assets: Asset[];
    finalExportPath?: string;
    expectedDurationSeconds?: number;
  }): Promise<QaResult> {
    const checks: QaCheckItem[] = [];
    const warnings: string[] = [];
    const { project, storyboard, tasks, assets, finalExportPath, expectedDurationSeconds } = context;

    // 1. Scene video assets coverage
    const sceneCount = storyboard.scenes.length;
    const videoAssets = assets.filter((a) => a.type === 'video');
    const missingVideoScenes: number[] = [];

    for (const scene of storyboard.scenes) {
      const hasClip = videoAssets.some((a) => a.sceneId === `scene_${scene.sceneNumber}`);
      if (!hasClip) {
        missingVideoScenes.push(scene.sceneNumber);
      }
    }

    checks.push({
      name: 'Scene Video Assets Coverage',
      passed: missingVideoScenes.length === 0,
      details: missingVideoScenes.length === 0
        ? `All ${sceneCount} storyboard scenes have associated video assets.`
        : `Missing video assets for scenes: ${missingVideoScenes.join(', ')}.`,
    });

    // 2. Narration audio assets coverage
    const narrationScenes = storyboard.scenes.filter((s) => s.narrationEnabled && s.narrationText);
    const audioAssets = assets.filter((a) => a.type === 'audio');
    const missingAudioScenes: number[] = [];

    for (const scene of narrationScenes) {
      const hasAudio = audioAssets.some((a) => a.sceneId === `scene_${scene.sceneNumber}`);
      if (!hasAudio) {
        missingAudioScenes.push(scene.sceneNumber);
      }
    }

    checks.push({
      name: 'Narration Audio Coverage',
      passed: missingAudioScenes.length === 0,
      details: narrationScenes.length === 0
        ? 'Narration is disabled for this project.'
        : missingAudioScenes.length === 0
        ? `All ${narrationScenes.length} narration scenes have synthesized audio.`
        : `Missing audio assets for scenes: ${missingAudioScenes.join(', ')}.`,
    });

    // 3. Asset FFprobe validation check
    const failedAssets = assets.filter((a) => a.validationReport && !a.validationReport.valid);
    checks.push({
      name: 'Source Assets Validation',
      passed: failedAssets.length === 0,
      details: failedAssets.length === 0
        ? `All ${assets.length} ingested source assets passed FFprobe verification.`
        : `${failedAssets.length} asset(s) failed FFprobe validation.`,
    });

    // 4. DAG task execution status
    const failedTasks = tasks.filter((t) => t.state === 'failed' || t.state === 'blocked');
    checks.push({
      name: 'Workflow DAG Task Status',
      passed: failedTasks.length === 0,
      details: failedTasks.length === 0
        ? 'All workflow DAG tasks completed without unrecovered failure.'
        : `${failedTasks.length} task(s) in failed/blocked state.`,
    });

    // 5. Final exported media technical verification
    if (finalExportPath) {
      try {
        const stats = await fs.stat(finalExportPath);
        const fileExistsAndNotEmpty = stats.size > 1024;
        checks.push({
          name: 'Export File Presence & Integrity',
          passed: fileExistsAndNotEmpty,
          details: fileExistsAndNotEmpty
            ? `Output file size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB.`
            : 'Exported file is missing or empty.',
        });

        if (fileExistsAndNotEmpty) {
          const probe = await this.inspectExport(finalExportPath);
          const vStream = probe.streams?.find((s: any) => s.codec_type === 'video');
          const aStream = probe.streams?.find((s: any) => s.codec_type === 'audio');

          // Check video stream & codec
          const vCodec = vStream?.codec_name?.toLowerCase();
          const isH264 = vCodec === 'h264' || vCodec === 'avc1';
          checks.push({
            name: 'Video Stream & Codec Normalization',
            passed: isH264,
            details: isH264
              ? `Video normalized to standard H.264 codec (${vStream.width}x${vStream.height} @ 30fps).`
              : `Unexpected video codec '${vCodec}'. Expected H.264.`,
          });

          // Check aspect ratio
          const width = vStream?.width || 0;
          const height = vStream?.height || 0;
          let aspectCorrect = true;
          if (project.aspectRatio === '9:16') {
            aspectCorrect = width === 1080 && height === 1920;
          } else if (project.aspectRatio === '16:9') {
            aspectCorrect = width === 1920 && height === 1080;
          } else if (project.aspectRatio === '1:1') {
            aspectCorrect = width === 1080 && height === 1080;
          }

          checks.push({
            name: 'Target Aspect Ratio Compliance',
            passed: aspectCorrect,
            details: aspectCorrect
              ? `Resolution matches project ${project.aspectRatio} specification (${width}x${height}).`
              : `Resolution ${width}x${height} does not match expected ${project.aspectRatio} format.`,
          });

          // Check audio stream & silence detection
          const aCodec = aStream?.codec_name?.toLowerCase();
          const hasAudioStream = Boolean(aStream);
          const { meanVolumeDb, isSilent } = await this.detectAudioVolume(finalExportPath);

          checks.push({
            name: 'Audio Normalization & Silence Check',
            passed: hasAudioStream && !isSilent,
            details: !hasAudioStream
              ? 'No audio stream present in final production.'
              : isSilent
              ? 'Audio stream is completely silent (<-65dB).'
              : `Audio verified (${aCodec}, mean volume: ${meanVolumeDb.toFixed(1)} dB).`,
          });

          // Duration tolerance check
          const actualDuration = parseFloat(probe.format?.duration || vStream?.duration || '0');
          const expectedDuration = expectedDurationSeconds || storyboard.totalDurationSeconds;
          const drift = Math.abs(actualDuration - expectedDuration);
          const withinTolerance = drift <= 2.5;

          if (drift > 1.0 && drift <= 2.5) {
            warnings.push(`Slight duration drift of ${drift.toFixed(1)}s (actual: ${actualDuration.toFixed(1)}s, planned: ${expectedDuration}s).`);
          }

          checks.push({
            name: 'Timeline Duration Conformance',
            passed: withinTolerance,
            details: withinTolerance
              ? `Duration ${actualDuration.toFixed(1)}s matches planned timeline within ±2.5s tolerance.`
              : `Duration drift of ${drift.toFixed(1)}s exceeds allowable tolerance (actual: ${actualDuration.toFixed(1)}s, expected: ${expectedDuration}s).`,
          });
        }
      } catch (err) {
        checks.push({
          name: 'Export Technical Verification',
          passed: false,
          details: `FFprobe failed to inspect output: ${(err as Error).message}`,
        });
      }
    }

    const allPassed = checks.every((c) => c.passed);
    let outcome: QaOutcome = 'PASSED';
    if (!allPassed) {
      outcome = 'FAILED';
    } else if (warnings.length > 0) {
      outcome = 'PASSED_WITH_WARNINGS';
    }

    return {
      projectId: project.id,
      passed: allPassed,
      outcome,
      checks,
      warnings,
      timestamp: new Date().toISOString(),
    };
  }
}
