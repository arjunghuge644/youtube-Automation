import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { AudioProvider, AudioGenerationRequest } from '../types.js';

export class ElevenLabsProvider implements AudioProvider {
  readonly id = 'elevenlabs';
  readonly name = 'ElevenLabs Generative Voice API';

  constructor(private apiKey?: string) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async synthesizeSpeech(request: AudioGenerationRequest): Promise<{
    externalJobId: string;
    audioUrl?: string;
    durationSeconds?: number;
    filePath?: string;
  }> {
    if (!this.isConfigured()) {
      throw new Error('ElevenLabs provider is not configured. Missing API key.');
    }

    const { text, projectId, sceneId, voiceId = '21m00Tcm4TlvDq8ikWAM' } = request;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API failed with status ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storageDir = path.resolve(process.cwd(), 'storage', 'projects', projectId, 'audio');
    await fs.mkdir(storageDir, { recursive: true });

    const hash = crypto.createHash('md5').update(`${text}:${voiceId}`).digest('hex').substring(0, 10);
    const outputPath = path.join(storageDir, `${sceneId || 'narration'}_${hash}.mp3`);
    await fs.writeFile(outputPath, buffer);

    return {
      externalJobId: `el_${hash}`,
      filePath: outputPath,
    };
  }
}

