import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export interface FrameInspectionMetrics {
  timestamp: number;
  frameIndex?: number;
  width: number;
  height: number;
  safeAreaCompliant: boolean;
  bleedPixels: number;
  verticalFillRatio: number;
  verticalFillCompliant: boolean;
  activeVerticalSpan: number;
  meanLuminance: number;
  luminanceStdDev: number;
  contrastCompliant: boolean;
  hasSubtitle: boolean;
  activeCanvasPixels: number;
}

export interface VideoVisualQAReport {
  overallPassed: boolean;
  totalFramesInspected: number;
  averageVerticalFillRatio: number;
  safeAreaPassRate: number;
  contrastPassRate: number;
  blackFrameDetected: boolean;
  subtitleCoverageRate: number;
  frameMetrics: FrameInspectionMetrics[];
  issues: string[];
  warnings: string[];
}

export class VisualFrameInspector {
  /**
   * Inspects a single frame extracted at the specified timestamp.
   */
  async inspectFrame(
    videoPath: string,
    timestampSeconds: number,
    options: { width?: number; height?: number } = {}
  ): Promise<FrameInspectionMetrics> {
    const width = options.width ?? 720;
    const height = options.height ?? 1280;
    const expectedBytes = width * height * 3;

    const { stdout } = await execFileAsync(
      'ffmpeg',
      [
        '-ss',
        timestampSeconds.toFixed(2),
        '-i',
        videoPath,
        '-vframes',
        '1',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'rgb24',
        '-',
      ],
      { encoding: 'buffer', maxBuffer: 15 * 1024 * 1024 }
    );

    if (stdout.length < expectedBytes) {
      throw new Error(
        `Failed to extract frame at ${timestampSeconds}s: buffer length ${stdout.length} < expected ${expectedBytes}`
      );
    }

    // 1. Luminance & contrast metrics
    let totalL = 0;
    let sumSqL = 0;
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 3;
      const r = stdout[idx];
      const g = stdout[idx + 1];
      const b = stdout[idx + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      totalL += l;
      sumSqL += l * l;
    }

    const meanLuminance = totalL / totalPixels;
    const varianceL = Math.max(0, sumSqL / totalPixels - meanLuminance * meanLuminance);
    const luminanceStdDev = Math.sqrt(varianceL);
    const isBlackFrame = meanLuminance < 4.0;
    const isWashedOut = meanLuminance > 220;
    const contrastCompliant = !isBlackFrame && !isWashedOut;

    // 2. Safe Area Margin Analysis
    // 9:16 safe area margin: outer 2.5% boundary (18px horizontal, 32px vertical)
    const marginX = Math.round(width * 0.025);
    const marginY = Math.round(height * 0.025);
    let bleedPixels = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isExtremeEdge =
          x < marginX || x >= width - marginX || y < marginY || y >= height - marginY;
        if (isExtremeEdge) {
          const idx = (y * width + x) * 3;
          const r = stdout[idx];
          const g = stdout[idx + 1];
          const b = stdout[idx + 2];
          const l = 0.299 * r + 0.587 * g + 0.114 * b;
          // High luminance or saturated element bleeding directly on outer boundary
          if (l > 130) {
            bleedPixels++;
          }
        }
      }
    }
    const safeAreaCompliant = bleedPixels === 0;

    // 3. Vertical Canvas Fill Factor (y: 140px to 1120px)
    const canvasTop = 140;
    const canvasBottom = 1120;
    let minY = canvasBottom;
    let maxY = canvasTop;
    let activeCanvasPixels = 0;

    for (let y = canvasTop; y < canvasBottom; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 3;
        const r = stdout[idx];
        const g = stdout[idx + 1];
        const b = stdout[idx + 2];
        const l = 0.299 * r + 0.587 * g + 0.114 * b;

        // Active foreground pixel differs from background #080F22
        const isForeground =
          l > 35 || Math.abs(r - 8) + Math.abs(g - 15) + Math.abs(b - 34) > 45;

        if (isForeground) {
          activeCanvasPixels++;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const activeVerticalSpan = maxY > minY ? maxY - minY : 0;
    const verticalFillRatio = activeVerticalSpan / (canvasBottom - canvasTop);
    const verticalFillCompliant = verticalFillRatio >= 0.55;

    // 4. Subtitle detection in bottom bar (y: 1120px to 1260px)
    let subtitlePixels = 0;
    for (let y = 1120; y < 1260; y++) {
      for (let x = 50; x < width - 50; x++) {
        const idx = (y * width + x) * 3;
        const r = stdout[idx];
        const g = stdout[idx + 1];
        const b = stdout[idx + 2];
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        if (l > 140) {
          subtitlePixels++;
        }
      }
    }
    const hasSubtitle = subtitlePixels > 60;

    return {
      timestamp: timestampSeconds,
      width,
      height,
      safeAreaCompliant,
      bleedPixels,
      verticalFillRatio: Math.round(verticalFillRatio * 1000) / 1000,
      verticalFillCompliant,
      activeVerticalSpan,
      meanLuminance: Math.round(meanLuminance * 10) / 10,
      luminanceStdDev: Math.round(luminanceStdDev * 10) / 10,
      contrastCompliant,
      hasSubtitle,
      activeCanvasPixels,
    };
  }

  /**
   * Inspects a video across multiple timestamps and evaluates overall visual production quality.
   */
  async inspectVideo(
    videoPath: string,
    options: {
      durationSeconds?: number;
      timestamps?: number[];
      sampleIntervalSeconds?: number;
    } = {}
  ): Promise<VideoVisualQAReport> {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Probe duration if not provided
    let duration = options.durationSeconds;
    if (!duration) {
      try {
        const { stdout } = await execFileAsync('ffprobe', [
          '-v',
          'quiet',
          '-print_format',
          'json',
          '-show_format',
          videoPath,
        ]);
        const parsed = JSON.parse(stdout);
        duration = parseFloat(parsed.format?.duration || '10');
      } catch {
        duration = 10;
      }
    }

    // Determine sampling points
    let timestamps = options.timestamps;
    if (!timestamps || timestamps.length === 0) {
      const interval = options.sampleIntervalSeconds ?? 3;
      timestamps = [];
      for (let t = Math.min(1.5, duration / 2); t < duration - 0.5; t += interval) {
        timestamps.push(Math.round(t * 10) / 10);
      }
    }

    if (timestamps.length === 0) {
      timestamps = [duration / 2];
    }

    const frameMetrics: FrameInspectionMetrics[] = [];
    let totalVerticalFill = 0;
    let safeAreaPasses = 0;
    let contrastPasses = 0;
    let subtitlesActiveCount = 0;
    let blackFramesFound = 0;

    for (let i = 0; i < timestamps.length; i++) {
      const ts = timestamps[i];
      try {
        const metrics = await this.inspectFrame(videoPath, ts);
        metrics.frameIndex = i;
        frameMetrics.push(metrics);

        totalVerticalFill += metrics.verticalFillRatio;
        if (metrics.safeAreaCompliant) safeAreaPasses++;
        if (metrics.contrastCompliant) contrastPasses++;
        if (metrics.hasSubtitle) subtitlesActiveCount++;
        if (metrics.meanLuminance < 4.0) blackFramesFound++;

        if (!metrics.safeAreaCompliant) {
          issues.push(
            `Timestamp ${ts}s: Text/element bleeding detected (${metrics.bleedPixels} bleed pixels) violating safe-area bounds.`
          );
        }

        if (!metrics.verticalFillCompliant) {
          warnings.push(
            `Timestamp ${ts}s: Low vertical canvas utilization (${(metrics.verticalFillRatio * 100).toFixed(1)}% < 55%).`
          );
        }

        if (metrics.meanLuminance < 4.0) {
          issues.push(
            `Timestamp ${ts}s: Black frame anomaly detected (mean luminance ${metrics.meanLuminance}).`
          );
        } else if (metrics.meanLuminance > 220) {
          issues.push(
            `Timestamp ${ts}s: Washed-out white frame detected (mean luminance ${metrics.meanLuminance}).`
          );
        } else if (metrics.luminanceStdDev < 4.0) {
          warnings.push(
            `Timestamp ${ts}s: Low dynamic range or solid test frame (luminance stddev ${metrics.luminanceStdDev}).`
          );
        }
      } catch (err: any) {
        warnings.push(`Frame inspection failed at ${ts}s: ${err.message}`);
      }
    }

    const inspectedCount = frameMetrics.length;
    const avgFillRatio = inspectedCount > 0 ? totalVerticalFill / inspectedCount : 0;
    const safePassRate = inspectedCount > 0 ? safeAreaPasses / inspectedCount : 0;
    const contrastPassRate = inspectedCount > 0 ? contrastPasses / inspectedCount : 0;
    const subCoverageRate = inspectedCount > 0 ? subtitlesActiveCount / inspectedCount : 0;
    const blackFrameDetected = blackFramesFound > 0;

    if (blackFrameDetected) {
      issues.push(`Detected ${blackFramesFound} black frames during visual inspection.`);
    }

    if (avgFillRatio < 0.60) {
      warnings.push(
        `Average vertical canvas fill (${(avgFillRatio * 100).toFixed(1)}%) is below optimal target (>= 60%).`
      );
    }

    return {
      overallPassed: issues.length === 0 && !blackFrameDetected && contrastPassRate >= 0.85,
      totalFramesInspected: inspectedCount,
      averageVerticalFillRatio: Math.round(avgFillRatio * 1000) / 1000,
      safeAreaPassRate: Math.round(safePassRate * 1000) / 1000,
      contrastPassRate: Math.round(contrastPassRate * 1000) / 1000,
      blackFrameDetected,
      subtitleCoverageRate: Math.round(subCoverageRate * 1000) / 1000,
      frameMetrics,
      issues,
      warnings,
    };
  }

  /**
   * Programmatically extracts representative keyframe images to disk.
   */
  async extractKeyframeImages(
    videoPath: string,
    outputDir: string,
    keyframes: { name: string; timestamp: number }[]
  ): Promise<string[]> {
    await fs.mkdir(outputDir, { recursive: true });
    const outputPaths: string[] = [];

    for (const kf of keyframes) {
      const outPath = path.join(outputDir, `${kf.name}.png`);
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss',
        kf.timestamp.toFixed(2),
        '-i',
        videoPath,
        '-vframes',
        '1',
        outPath,
      ]);
      outputPaths.push(outPath);
    }

    return outputPaths;
  }
}
