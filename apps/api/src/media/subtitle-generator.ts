import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { SubtitleItem } from '@creatorflow/shared';

function formatSrtTimestamp(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  const millis = Math.floor((safeSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

export class SubtitleGenerator {
  /**
   * Break narration text into natural sentence chunks with start/end timing.
   */
  chunkNarration(text: string, sceneStartOffset: number, sceneDuration: number): SubtitleItem[] {
    if (!text.trim()) return [];

    // Split on Hindi danda (।) or English punctuation (. ! ?) or line breaks
    const sentences = text
      .split(/(?<=[।!?.\n])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (sentences.length === 0) {
      return [{
        text: text.trim(),
        startSeconds: sceneStartOffset,
        endSeconds: sceneStartOffset + sceneDuration,
      }];
    }

    const chunkDuration = Number((sceneDuration / sentences.length).toFixed(2));
    const items: SubtitleItem[] = [];

    for (let i = 0; i < sentences.length; i++) {
      const start = Number((sceneStartOffset + i * chunkDuration).toFixed(2));
      const end = i === sentences.length - 1
        ? Number((sceneStartOffset + sceneDuration).toFixed(2))
        : Number((sceneStartOffset + (i + 1) * chunkDuration).toFixed(2));

      items.push({
        text: sentences[i],
        startSeconds: start,
        endSeconds: end,
      });
    }

    return items;
  }

  /**
   * Convert subtitle items into standard SRT format.
   */
  formatSrt(subtitles: SubtitleItem[]): string {
    return subtitles
      .map((item, index) => {
        const startStr = formatSrtTimestamp(item.startSeconds);
        const endStr = formatSrtTimestamp(item.endSeconds);
        return `${index + 1}\n${startStr} --> ${endStr}\n${item.text}\n`;
      })
      .join('\n');
  }

  /**
   * Write SRT file to disk.
   */
  async writeSrtFile(subtitles: SubtitleItem[], outputPath: string): Promise<string> {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const content = this.formatSrt(subtitles);
    await fs.writeFile(outputPath, content, 'utf-8');
    return outputPath;
  }

  /**
   * Verify subtitle timestamps against final video duration.
   */
  async validateSrt(outputPath: string, maxDuration: number): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    try {
      const content = await fs.readFile(outputPath, 'utf-8');
      const timeRegex = /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2}),(\d{3})/g;
      let match: RegExpExecArray | null;

      while ((match = timeRegex.exec(content)) !== null) {
        const startSec = parseInt(match[1], 10) * 3600 + parseInt(match[2], 10) * 60 + parseInt(match[3], 10) + parseInt(match[4], 10) / 1000;
        const endSec = parseInt(match[5], 10) * 3600 + parseInt(match[6], 10) * 60 + parseInt(match[7], 10) + parseInt(match[8], 10) / 1000;

        if (endSec <= startSec) {
          issues.push(`Subtitle end time (${endSec}s) is not after start time (${startSec}s).`);
        }
        if (endSec > maxDuration + 1.0) {
          issues.push(`Subtitle end time (${endSec}s) exceeds total video duration (${maxDuration}s).`);
        }
      }
    } catch (err) {
      issues.push(`Cannot read subtitle file: ${(err as Error).message}`);
    }

    return { valid: issues.length === 0, issues };
  }
}

