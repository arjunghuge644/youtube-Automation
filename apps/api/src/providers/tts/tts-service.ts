import type { AudioProvider, AudioGenerationRequest } from '../types.js';
import { LocalSpeechSynthesizer } from './local-synthesizer.js';
import { ElevenLabsProvider } from './elevenlabs.js';
import { GeminiTTSProvider } from './gemini-tts.js';

export class TTSService {
  private providers = new Map<string, AudioProvider>();
  private defaultProviderId = 'local_tts';

  constructor(
    optionsOrElevenLabsKey?:
      | string
      | { elevenLabsApiKey?: string; geminiApiKey?: string; defaultProvider?: string }
  ) {
    const local = new LocalSpeechSynthesizer();
    this.providers.set(local.id, local);

    let elevenLabsApiKey: string | undefined;
    let geminiApiKey: string | undefined;
    let preferredDefault: string | undefined;

    if (typeof optionsOrElevenLabsKey === 'string') {
      elevenLabsApiKey = optionsOrElevenLabsKey;
    } else if (optionsOrElevenLabsKey) {
      elevenLabsApiKey = optionsOrElevenLabsKey.elevenLabsApiKey;
      geminiApiKey = optionsOrElevenLabsKey.geminiApiKey;
      preferredDefault = optionsOrElevenLabsKey.defaultProvider;
    }

    geminiApiKey = geminiApiKey || process.env.GEMINI_API_KEY;
    elevenLabsApiKey = elevenLabsApiKey || process.env.ELEVENLABS_API_KEY;

    if (geminiApiKey) {
      const geminiTTS = new GeminiTTSProvider(geminiApiKey);
      this.providers.set(geminiTTS.id, geminiTTS);
      this.defaultProviderId = geminiTTS.id;
    }

    if (elevenLabsApiKey) {
      const elevenLabs = new ElevenLabsProvider(elevenLabsApiKey);
      this.providers.set(elevenLabs.id, elevenLabs);
      this.defaultProviderId = elevenLabs.id;
    }

    if (preferredDefault && this.providers.has(preferredDefault)) {
      this.defaultProviderId = preferredDefault;
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

