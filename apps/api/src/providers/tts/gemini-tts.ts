import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';
import type { AudioProvider, AudioGenerationRequest } from '../types.js';

const execFileAsync = promisify(execFile);

export class GeminiTTSProvider implements AudioProvider {
  readonly id = 'gemini_tts';
  readonly name = 'Google Gemini 3.8 Flash TTS';

  readonly ttsModel: string;
  private client?: GoogleGenAI;

  constructor(private apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.ttsModel = model || process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';

    if (this.isConfigured()) {
      try {
        this.client = new GoogleGenAI({ apiKey: this.apiKey });
      } catch {
        // Handled dynamically during execution
      }
    }
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Pre-selects prebuilt Gemini voice based on style or explicit voice name.
   * Gemini 3.8 prebuilt voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'
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
      case 'conversational':
        return 'Aoede';
      case 'technical':
      default:
        return 'Kore'; // Warm, natural explanatory voice
    }
  }

  /**
   * Resolves the appropriate speech metadata instruction for Gemini 3.8 TTS.
   */
  resolveSpeechStyle(language?: string, style?: string): string {
    if (language === 'hi') {
      return 'professional documentary narration in clear natural Hindi';
    }
    if (language === 'hinglish') {
      return 'natural and engaging Indian tech explainer narration in Hinglish with accurate technical terms';
    }
    switch (style) {
      case 'calm':
        return 'calm, measured, and authoritative documentary narration';
      case 'energetic':
        return 'energetic, fast-paced, and engaging explainer narration';
      case 'documentary':
        return 'deep, cinematic, and clear documentary narration';
      case 'conversational':
        return 'friendly, conversational, and accessible tech narration';
      default:
        return 'natural, engaging, and clear technical explainer narration';
    }
  }

  /**
   * Formats API error messages according to standard HTTP status codes.
   */
  formatApiError(status: number | undefined, rawMessage: string, model: string): Error {
    const msg = rawMessage || '';
    if (status === 404 || msg.includes('404') || msg.toLowerCase().includes('not found')) {
      return new Error(
        `Gemini TTS model '${model}' is unavailable or not found (HTTP 404). Please verify GEMINI_TTS_MODEL and project access: ${msg}`
      );
    }
    if (status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
      return new Error(
        `Gemini TTS rate limit or quota exhausted (HTTP 429). Please check your API quota or retry later: ${msg}`
      );
    }
    if (status === 401 || status === 403 || msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('api key')) {
      return new Error(
        `Gemini TTS authentication or permission failure (HTTP ${status || 401}). Please verify GEMINI_API_KEY: ${msg}`
      );
    }
    return new Error(`Gemini TTS API failed with status ${status || 'unknown'}: ${msg}`);
  }

  /**
   * Confirms whether the selected TTS model is available to the API project.
   */
  async confirmModelAvailability(model?: string): Promise<{ available: boolean; model: string; error?: string }> {
    const targetModel = model || this.ttsModel;
    if (!this.isConfigured()) {
      return { available: false, model: targetModel, error: 'GEMINI_API_KEY is not configured.' };
    }

    try {
      if (this.client?.models?.get) {
        await this.client.models.get({ model: targetModel });
        return { available: true, model: targetModel };
      }
      return { available: true, model: targetModel };
    } catch (err: any) {
      const formatted = this.formatApiError(err.status, err.message, targetModel);
      return { available: false, model: targetModel, error: formatted.message };
    }
  }

  async synthesizeSpeech(request: AudioGenerationRequest): Promise<{
    externalJobId: string;
    audioUrl?: string;
    durationSeconds: number;
    filePath: string;
    provider: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('Gemini TTS provider is not configured. Missing GEMINI_API_KEY.');
    }

    const { text, projectId, sceneId, style, voiceId, language } = request;
    if (!text || !text.trim()) {
      throw new Error('Narration text cannot be empty.');
    }

    const voiceName = this.resolveVoiceName(style, voiceId);
    const speechStyle = this.resolveSpeechStyle(language, style);

    const storageDir = path.resolve(process.cwd(), 'storage', 'projects', projectId, 'audio');
    await fs.mkdir(storageDir, { recursive: true });

    const hash = crypto
      .createHash('md5')
      .update(`${this.ttsModel}:${text}:${voiceName}:${language || 'en'}:${speechStyle}`)
      .digest('hex')
      .substring(0, 10);
    const wavOutputPath = path.join(storageDir, `${sceneId || 'narration'}_${hash}.wav`);
    const aacOutputPath = path.join(storageDir, `${sceneId || 'narration'}_${hash}.aac`);

    // Reuse existing file if already synthesized for identical text, voice, and model
    try {
      await fs.access(aacOutputPath);
      const probe = await this.inspectMedia(aacOutputPath);
      const durationSeconds = Number(probe.format?.duration || 3.0);
      return {
        externalJobId: `gemini_${hash}`,
        durationSeconds,
        filePath: aacOutputPath,
        provider: this.id,
      };
    } catch {
      // Not cached, synthesize with Gemini Interactions API
    }

    let outputAudioData: { data?: string; mime_type?: string } | undefined;

    // Use official Google GenAI Interactions API client
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }

    try {
      const interaction = await this.client.interactions.create({
        model: this.ttsModel,
        input: [
          {
            type: 'user_input',
            content: [
              {
                type: 'text',
                text,
                annotations: [
                  {
                    type: 'speech_metadata',
                    style: speechStyle,
                  },
                ],
              },
            ],
          },
        ] as any,
        response_format: { type: 'audio' } as any,
        generation_config: {
          speech_config: [
            {
              voice: voiceName,
            },
          ],
        } as any,
      });

      const audio = (interaction as any).output_audio;
      if (audio?.data) {
        outputAudioData = {
          data: audio.data,
          mime_type: audio.mime_type || 'audio/wav',
        };
      }
    } catch (sdkError: any) {
      const status = sdkError.status || sdkError.statusCode;
      const msg = sdkError.message || '';
      throw this.formatApiError(status, msg, this.ttsModel);
    }

    // Validate presence of returned audio payload
    if (!outputAudioData?.data || outputAudioData.data.trim().length === 0) {
      throw new Error('Missing audio output: Gemini TTS response did not contain output_audio data.');
    }

    const audioBytes = Buffer.from(outputAudioData.data, 'base64');

    // Validate WAV data integrity
    if (audioBytes.length < 44) {
      throw new Error('Invalid WAV data: Audio payload is empty or too short to contain a valid WAV header.');
    }

    // Check standard RIFF / WAVE header if mime_type is WAV or default
    const isRiff = audioBytes.subarray(0, 4).toString('ascii') === 'RIFF';
    const isWave = audioBytes.subarray(8, 12).toString('ascii') === 'WAVE';
    if (!isRiff && !isWave && (outputAudioData.mime_type || '').includes('wav')) {
      throw new Error('Invalid WAV data: Missing RIFF/WAVE header in audio response.');
    }

    // Save WAV bytes to disk
    await fs.writeFile(wavOutputPath, audioBytes);

    // Verify WAV with FFprobe
    let wavProbe: any;
    try {
      wavProbe = await this.inspectMedia(wavOutputPath);
      const audioStream = wavProbe.streams?.find((s: any) => s.codec_type === 'audio');
      const wavDuration = Number(wavProbe.format?.duration || audioStream?.duration || 0);
      if (!audioStream || wavDuration <= 0) {
        throw new Error('FFprobe found no valid audio streams or zero duration');
      }
    } catch (probeErr: any) {
      await fs.unlink(wavOutputPath).catch(() => {});
      throw new Error(`Invalid WAV data: FFprobe failed to verify valid audio stream in Gemini TTS output: ${probeErr.message}`);
    }

    // Transcode to normalized AAC for optimal Remotion and video player compatibility
    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        wavOutputPath,
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        aacOutputPath,
      ]);
    } catch (ffmpegErr: any) {
      throw new Error(`Failed to transcode Gemini TTS audio with FFmpeg: ${ffmpegErr.message}`);
    } finally {
      // Clean up temporary WAV file
      await fs.unlink(wavOutputPath).catch(() => {});
    }

    const aacProbe = await this.inspectMedia(aacOutputPath);
    const durationSeconds = Number(aacProbe.format?.duration || wavProbe.format?.duration || 3.0);

    return {
      externalJobId: `gemini_${hash}`,
      durationSeconds,
      filePath: aacOutputPath,
      provider: this.id,
    };
  }

  private async inspectMedia(filePath: string): Promise<any> {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);
    return JSON.parse(stdout);
  }
}
