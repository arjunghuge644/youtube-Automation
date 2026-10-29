import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AudioProvider, AudioGenerationRequest } from '../types.js';

const execFileAsync = promisify(execFile);

export class GeminiTTSProvider implements AudioProvider {
  readonly id = 'gemini_tts';
  readonly name = 'Google Gemini Multimodal Audio TTS';

  private candidateModels: string[];

  constructor(private apiKey?: string, model?: string) {
    const configuredModel = model || process.env.GEMINI_TTS_MODEL;
    this.candidateModels = Array.from(
      new Set(
        [
          configuredModel,
          'gemini-2.5-flash',
          'gemini-2.5-flash-preview-tts',
          'gemini-2.0-flash-exp',
        ].filter(Boolean) as string[]
      )
    );
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Pre-selects prebuilt Gemini voice based on style or explicit voice name.
   * Gemini voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'
   */
  resolveVoiceName(style?: string, requestedVoice?: string): string {
    if (requestedVoice && ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'].includes(requestedVoice)) {
      return requestedVoice;
    }
    switch (style) {
      case 'calm':
        return 'Charon';
      case 'documentary':
        return 'Fenrir';
      case 'energetic':
        return 'Puck';
      default:
        return 'Kore'; // Warm, natural explanatory voice
    }
  }

  async synthesizeSpeech(request: AudioGenerationRequest): Promise<{
    externalJobId: string;
    audioUrl?: string;
    durationSeconds: number;
    filePath: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Gemini TTS provider is not configured. Missing GEMINI_API_KEY.');
    }

    const { text, projectId, sceneId, style, voiceId, language } = request;
    const voiceName = this.resolveVoiceName(style, voiceId);

    const storageDir = path.resolve(process.cwd(), 'storage', 'projects', projectId, 'audio');
    await fs.mkdir(storageDir, { recursive: true });

    const hash = crypto
      .createHash('md5')
      .update(`${text}:${voiceName}:${language}`)
      .digest('hex')
      .substring(0, 10);
    const outputPath = path.join(storageDir, `${sceneId || 'narration'}_${hash}.aac`);

    // Reuse existing file if already synthesized for identical text and voice
    try {
      await fs.access(outputPath);
      const probe = await this.inspectMedia(outputPath);
      const durationSeconds = Number(probe.format?.duration || 3.0);
      return {
        externalJobId: `gemini_${hash}`,
        durationSeconds,
        filePath: outputPath,
      };
    } catch {
      // Not cached, synthesize with Gemini API
    }

    const promptText =
      language === 'hi'
        ? `Please read the following Hindi script clearly, with natural pronunciation and professional documentary pacing:\n\n${text}`
        : language === 'hinglish'
        ? `Please read the following Hinglish script clearly and naturally for an Indian tech audience:\n\n${text}`
        : `Please read the following narration naturally, clearly, and engagingly at standard speech pace:\n\n${text}`;

    let lastError: Error | null = null;
    let data: any = null;

    for (const model of this.candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: promptText }],
              },
            ],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName,
                  },
                },
              },
            },
          }),
        });

        if (response.ok) {
          data = await response.json();
          // Promote working model to front of candidates for subsequent scenes
          if (this.candidateModels[0] !== model) {
            this.candidateModels = [model, ...this.candidateModels.filter((m) => m !== model)];
          }
          break;
        }

        const errText = await response.text();
        lastError = new Error(`Gemini TTS API (${model}) failed with status ${response.status}: ${errText}`);

        // If not 404 (e.g. 400 bad key, 429 quota), don't hammer other models
        if (response.status !== 404) {
          break;
        }
      } catch (fetchErr: any) {
        lastError = fetchErr;
      }
    }

    if (!data) {
      throw lastError || new Error('Gemini TTS API failed across all candidate models.');
    }
    const candidate = data.candidates?.[0];
    const part = candidate?.content?.parts?.find((p: any) => p.inlineData);

    if (!part?.inlineData?.data) {
      throw new Error('Gemini TTS API returned response without audio inlineData.');
    }

    const mimeType = part.inlineData.mimeType || 'audio/pcm;rate=24000';
    const audioBytes = Buffer.from(part.inlineData.data, 'base64');

    // Convert audio to normalized AAC using FFmpeg based on mimeType
    if (mimeType.includes('pcm') || mimeType.includes('rate=24000')) {
      const rawPcmPath = path.join(storageDir, `temp_${hash}.pcm`);
      await fs.writeFile(rawPcmPath, audioBytes);
      try {
        await execFileAsync('ffmpeg', [
          '-y',
          '-f',
          's16le',
          '-ar',
          '24000',
          '-ac',
          '1',
          '-i',
          rawPcmPath,
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          outputPath,
        ]);
      } finally {
        await fs.unlink(rawPcmPath).catch(() => {});
      }
    } else {
      const tempPath = path.join(storageDir, `temp_${hash}.bin`);
      await fs.writeFile(tempPath, audioBytes);
      try {
        await execFileAsync('ffmpeg', [
          '-y',
          '-i',
          tempPath,
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          outputPath,
        ]);
      } finally {
        await fs.unlink(tempPath).catch(() => {});
      }
    }

    const probe = await this.inspectMedia(outputPath);
    const durationSeconds = Number(probe.format?.duration || 3.0);

    return {
      externalJobId: `gemini_${hash}`,
      durationSeconds,
      filePath: outputPath,
    };
  }

  private async inspectMedia(filePath: string): Promise<any> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      filePath,
    ]);
    return JSON.parse(stdout);
  }
}

