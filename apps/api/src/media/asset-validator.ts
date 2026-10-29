import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AssetValidationReport } from '@creatorflow/shared';

const execFileAsync = promisify(execFile);

export interface ValidationCriteria {
  expectedAspectRatio?: '9:16' | '16:9' | '1:1';
  targetDurationSeconds?: number;
  durationToleranceSeconds?: number; // default 1.5s
  requireAudio?: boolean;
}

export class AssetValidator {
  async inspectMedia(filePath: string): Promise<any> {
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);
      return JSON.parse(stdout);
    } catch (err) {
      throw new Error(`FFprobe failed to inspect ${filePath}: ${(err as Error).message}`);
    }
  }

  async validateVideoAsset(
    filePath: string,
    criteria: ValidationCriteria = {},
  ): Promise<AssetValidationReport> {
    const issues: string[] = [];
    const {
      expectedAspectRatio,
      targetDurationSeconds,
      durationToleranceSeconds = 2.0,
      requireAudio = false,
    } = criteria;

    let probeData: any;
    try {
      probeData = await this.inspectMedia(filePath);
    } catch (error) {
      return {
        valid: false,
        codec: 'unknown',
        aspectRatioMatches: false,
        hasAudio: false,
        durationDiffSeconds: 0,
        issues: [`Corrupted media or unsupported container: ${(error as Error).message}`],
      };
    }

    const videoStream = probeData.streams?.find((s: any) => s.codec_type === 'video');
    const audioStream = probeData.streams?.find((s: any) => s.codec_type === 'audio');

    if (!videoStream) {
      return {
        valid: false,
        codec: 'none',
        aspectRatioMatches: false,
        hasAudio: Boolean(audioStream),
        durationDiffSeconds: 0,
        issues: ['No video stream detected in file.'],
      };
    }

    const codec = videoStream.codec_name || 'unknown';
    const supportedCodecs = ['h264', 'avc1', 'vp9', 'av1', 'hevc'];
    if (!supportedCodecs.includes(codec.toLowerCase())) {
      issues.push(`Unsupported video codec ${codec}. Expected H.264 / VP9 / AV1.`);
    }

    // Check aspect ratio
    const width = videoStream.width || 0;
    const height = videoStream.height || 0;
    let aspectRatioMatches = true;

    if (expectedAspectRatio && width > 0 && height > 0) {
      const actualRatio = width / height;
      const targetRatio = expectedAspectRatio === '9:16' ? 9 / 16 : expectedAspectRatio === '16:9' ? 16 / 9 : 1.0;
      const ratioDiff = Math.abs(actualRatio - targetRatio);
      if (ratioDiff > 0.08) {
        aspectRatioMatches = false;
        issues.push(`Aspect ratio mismatch: file is ${width}x${height} (${actualRatio.toFixed(2)}), expected ${expectedAspectRatio} (${targetRatio.toFixed(2)}).`);
      }
    }

    // Check duration drift
    const duration = parseFloat(videoStream.duration || probeData.format?.duration || '0');
    let durationDiffSeconds = 0;
    if (targetDurationSeconds && duration > 0) {
      durationDiffSeconds = Math.abs(duration - targetDurationSeconds);
      if (durationDiffSeconds > durationToleranceSeconds) {
        issues.push(`Duration drift exceeds tolerance: file is ${duration.toFixed(1)}s, expected ${targetDurationSeconds}s (tolerance ±${durationToleranceSeconds}s).`);
      }
    }

    const hasAudio = Boolean(audioStream);
    if (requireAudio && !hasAudio) {
      issues.push('Missing required audio stream in video asset.');
    }

    const valid = issues.length === 0;
    return {
      valid,
      codec,
      aspectRatioMatches,
      hasAudio,
      durationDiffSeconds: Number(durationDiffSeconds.toFixed(2)),
      issues,
    };
  }

  async validateAudioAsset(
    filePath: string,
    minDurationSeconds = 0.1
  ): Promise<{ valid: boolean; codec: string; durationSeconds: number; issues: string[] }> {
    const issues: string[] = [];
    let probeData: any;
    try {
      probeData = await this.inspectMedia(filePath);
    } catch (error) {
      return {
        valid: false,
        codec: 'unknown',
        durationSeconds: 0,
        issues: [`Corrupted audio or unreadable file: ${(error as Error).message}`],
      };
    }

    const audioStream = probeData.streams?.find((s: any) => s.codec_type === 'audio');
    if (!audioStream) {
      issues.push('No audio stream detected in file.');
    }

    const duration = parseFloat(audioStream?.duration || probeData.format?.duration || '0');
    if (duration < minDurationSeconds) {
      issues.push(`Audio duration too short (${duration.toFixed(2)}s < ${minDurationSeconds}s).`);
    }

    return {
      valid: issues.length === 0,
      codec: audioStream?.codec_name || 'unknown',
      durationSeconds: Number(duration.toFixed(2)),
      issues,
    };
  }
}

