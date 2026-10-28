import type { AudioProvider, AudioGenerationRequest } from '../types.js';
import { LocalSpeechSynthesizer } from './local-synthesizer.js';
import { ElevenLabsProvider } from './elevenlabs.js';

export class TTSService {
  private providers = new Map<string, AudioProvider>();
  private defaultProviderId = 'local_tts';

  constructor(elevenLabsApiKey?: string) {
    const local = new LocalSpeechSynthesizer();
    this.providers.set(local.id, local);

    if (elevenLabsApiKey) {
      const elevenLabs = new ElevenLabsProvider(elevenLabsApiKey);
      this.providers.set(elevenLabs.id, elevenLabs);
      this.defaultProviderId = elevenLabs.id;
    }
  }

  getProvider(providerId?: string): AudioProvider {
    const id = providerId || this.defaultProviderId;
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`TTS provider '${id}' is not available or supported.`);
    }
    return provider;
  }

  async synthesize(request: AudioGenerationRequest, providerId?: string): Promise<{
    externalJobId: string;
    filePath: string;
    durationSeconds: number;
    provider: string;
  }> {
    const provider = this.getProvider(providerId);
    const result = await provider.synthesizeSpeech(request);
    return {
      externalJobId: result.externalJobId,
      filePath: result.filePath!,
      durationSeconds: result.durationSeconds || 3.0,
      provider: provider.id,
    };
  }
}

