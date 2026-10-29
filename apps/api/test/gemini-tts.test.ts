import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiTTSProvider } from '../src/providers/tts/gemini-tts.js';
import { TTSService } from '../src/providers/tts/tts-service.js';

describe('GeminiTTSProvider', () => {
  it('correctly reports configuration status based on apiKey presence', () => {
    const unconfigured = new GeminiTTSProvider();
    expect(unconfigured.isConfigured()).toBe(false);

    const configured = new GeminiTTSProvider('test_gemini_key');
    expect(configured.isConfigured()).toBe(true);
  });

  it('resolves voice names correctly based on narration style', () => {
    const provider = new GeminiTTSProvider('test_key');
    expect(provider.resolveVoiceName('calm')).toBe('Charon');
    expect(provider.resolveVoiceName('documentary')).toBe('Fenrir');
    expect(provider.resolveVoiceName('energetic')).toBe('Puck');
    expect(provider.resolveVoiceName('technical')).toBe('Kore');
    expect(provider.resolveVoiceName(undefined, 'Aoede')).toBe('Aoede');
  });

  it('rejects synthesis if GEMINI_API_KEY is not configured', async () => {
    const provider = new GeminiTTSProvider('');
    await expect(
      provider.synthesizeSpeech({
        taskId: 't1',
        projectId: 'p1',
        sceneId: 's1',
        text: 'Hello world',
        language: 'en',
      })
    ).rejects.toThrow('Missing GEMINI_API_KEY');
  });
});

describe('TTSService with Gemini TTS', () => {
  it('registers Gemini TTS and sets it as default when geminiApiKey is provided', () => {
    const service = new TTSService({ geminiApiKey: 'gemini_secret_123' });
    const provider = service.getProvider();
    expect(provider.id).toBe('gemini_tts');
    expect(provider.name).toContain('Google Gemini');
  });

  it('falls back to local_tts when no API keys are provided', () => {
    const service = new TTSService();
    const provider = service.getProvider();
    expect(provider.id).toBe('local_tts');
  });

  it('allows explicit selection of local_tts or gemini_tts', () => {
    const service = new TTSService({ geminiApiKey: 'gemini_secret_123' });
    const local = service.getProvider('local_tts');
    expect(local.id).toBe('local_tts');

    const gemini = service.getProvider('gemini_tts');
    expect(gemini.id).toBe('gemini_tts');
  });
});

