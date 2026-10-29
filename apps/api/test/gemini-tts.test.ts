import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiTTSProvider } from '../src/providers/tts/gemini-tts.js';
import { TTSService } from '../src/providers/tts/tts-service.js';
import { RemotionRendererService } from '../src/render/remotion-renderer.js';

function createTestWavBuffer(durationSeconds = 0.5, sampleRate = 24000): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.floor(Math.sin(2 * Math.PI * 440 * t) * 16000);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  return buffer;
}

function mockFetchInteraction(jsonBody: any, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    return new Response(JSON.stringify(jsonBody), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  });
}

describe('GeminiTTSProvider Configuration & Model Routing', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_TTS_MODEL;
    delete process.env.GEMINI_TEXT_MODEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('defaults to gemini-3.8-flash-tts and completely removes gemini-2.0-flash', () => {
    const provider = new GeminiTTSProvider('test_key');
    expect(provider.ttsModel).toBe('gemini-3.8-flash-tts');
    expect(provider.ttsModel).not.toContain('2.0');
    expect(provider.name).toContain('Gemini 3.8');
  });

  it('respects GEMINI_TTS_MODEL environment variable override', () => {
    process.env.GEMINI_TTS_MODEL = 'gemini-3.8-flash-lite-tts';
    const provider = new GeminiTTSProvider('test_key');
    expect(provider.ttsModel).toBe('gemini-3.8-flash-lite-tts');
  });

  it('respects explicit constructor model override', () => {
    const provider = new GeminiTTSProvider('test_key', 'custom-tts-model');
    expect(provider.ttsModel).toBe('custom-tts-model');
  });

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
    expect(provider.resolveVoiceName('conversational')).toBe('Aoede');
    expect(provider.resolveVoiceName('technical')).toBe('Kore');
    expect(provider.resolveVoiceName(undefined, 'Aoede')).toBe('Aoede');
  });

  it('resolves speech metadata styles for Hindi and Hinglish', () => {
    const provider = new GeminiTTSProvider('test_key');
    expect(provider.resolveSpeechStyle('hi')).toContain('Hindi');
    expect(provider.resolveSpeechStyle('hinglish')).toContain('Hinglish');
    expect(provider.resolveSpeechStyle('en', 'calm')).toContain('calm');
    expect(provider.resolveSpeechStyle('en', 'energetic')).toContain('energetic');
  });
});

describe('GeminiTTSProvider Speech Synthesis & WAV Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('synthesizes valid speech, verifies WAV with FFprobe, and transcodes to AAC', async () => {
    const testWav = createTestWavBuffer(0.5, 24000);

    mockFetchInteraction({
      id: 'interaction_1',
      steps: [
        {
          type: 'model_output',
          content: [
            {
              type: 'audio',
              data: testWav.toString('base64'),
              mime_type: 'audio/wav',
            },
          ],
        },
      ],
    });

    const provider = new GeminiTTSProvider('test_key_valid');
    const result = await provider.synthesizeSpeech({
      taskId: 'test_task_1',
      projectId: `test_proj_wav_${Date.now()}`,
      sceneId: 'scene_wav',
      text: 'Distributed systems require fault-tolerant consensus.',
      language: 'en',
      style: 'technical',
    });

    expect(result.filePath).toContain('.aac');
    expect(result.durationSeconds).toBeGreaterThan(0.2);
    expect(result.provider).toBe('gemini_tts');
  });

  it('synthesizes short Hindi narration script with correct metadata', async () => {
    const testWav = createTestWavBuffer(0.6, 24000);
    let capturedBody: any = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (urlOrReq: any) => {
      if (typeof urlOrReq !== 'string') {
        capturedBody = await urlOrReq.clone().json();
      }
      return new Response(
        JSON.stringify({
          id: 'interaction_hi',
          steps: [
            {
              type: 'model_output',
              content: [
                {
                  type: 'audio',
                  data: testWav.toString('base64'),
                  mime_type: 'audio/wav',
                },
              ],
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    });

    const provider = new GeminiTTSProvider('test_key_hindi');
    const result = await provider.synthesizeSpeech({
      taskId: 'task_hi',
      projectId: `proj_hi_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sceneId: 'scene_hi',
      text: 'नमस्ते दोस्तों! आज हम बात करेंगे डिस्ट्रीब्यूटेड रेट लिमिटर कैसे काम करता है।',
      language: 'hi',
    });

    expect(capturedBody.input[0].content[0].annotations[0].style).toContain('Hindi');
    expect(result.durationSeconds).toBeGreaterThan(0);
  });

  it('synthesizes short Hinglish narration script with correct metadata', async () => {
    const testWav = createTestWavBuffer(0.6, 24000);
    let capturedBody: any = null;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (urlOrReq: any) => {
      if (typeof urlOrReq !== 'string') {
        capturedBody = await urlOrReq.clone().json();
      }
      return new Response(
        JSON.stringify({
          id: 'interaction_hinglish',
          steps: [
            {
              type: 'model_output',
              content: [
                {
                  type: 'audio',
                  data: testWav.toString('base64'),
                  mime_type: 'audio/wav',
                },
              ],
            },
          ],
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    });

    const provider = new GeminiTTSProvider('test_key_hinglish');
    const result = await provider.synthesizeSpeech({
      taskId: 'task_hinglish',
      projectId: `proj_hinglish_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sceneId: 'scene_hinglish',
      text: 'Swiggy ya Zomato jaisa food app banana hai toh caching layer zaroori hai.',
      language: 'hinglish',
    });

    expect(capturedBody.input[0].content[0].annotations[0].style).toContain('Hinglish');
    expect(result.durationSeconds).toBeGreaterThan(0);
  });
});

describe('GeminiTTSProvider Explicit Error Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('clearly handles HTTP 404 for unavailable or retired models', async () => {
    mockFetchInteraction(
      {
        error: {
          code: 404,
          message: 'Model gemini-3.8-flash-tts not found or unavailable in this project.',
          status: 'NOT_FOUND',
        },
      },
      404
    );

    const provider = new GeminiTTSProvider('test_key');
    await expect(
      provider.synthesizeSpeech({
        taskId: 't404',
        projectId: 'p404',
        sceneId: 's404',
        text: 'Testing 404 handling',
        language: 'en',
      })
    ).rejects.toThrow(/unavailable or not found \(HTTP 404\)/);
  });

  it('clearly handles HTTP 429 for rate limit or quota exhaustion', async () => {
    mockFetchInteraction(
      {
        error: {
          code: 429,
          message: 'Resource has been exhausted (e.g. check quota).',
          status: 'RESOURCE_EXHAUSTED',
        },
      },
      429
    );

    const provider = new GeminiTTSProvider('test_key');
    await expect(
      provider.synthesizeSpeech({
        taskId: 't429',
        projectId: 'p429',
        sceneId: 's429',
        text: 'Testing 429 handling',
        language: 'en',
      })
    ).rejects.toThrow(/rate limit or quota exhausted \(HTTP 429\)/);
  });

  it('clearly handles HTTP 401/403 for authentication and permission failure', async () => {
    mockFetchInteraction(
      {
        error: {
          code: 401,
          message: 'API key not valid. Please pass a valid API key.',
          status: 'UNAUTHENTICATED',
        },
      },
      401
    );

    const provider = new GeminiTTSProvider('invalid_key');
    await expect(
      provider.synthesizeSpeech({
        taskId: 't401',
        projectId: 'p401',
        sceneId: 's401',
        text: 'Testing 401 handling',
        language: 'en',
      })
    ).rejects.toThrow(/authentication or permission failure \(HTTP 401\)/);
  });

  it('throws clear error when response contains missing audio output', async () => {
    mockFetchInteraction({
      id: 'interaction_empty',
      steps: [
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              text: 'Text only without audio content block',
            },
          ],
        },
      ],
    });

    const provider = new GeminiTTSProvider('test_key');
    await expect(
      provider.synthesizeSpeech({
        taskId: 't_missing',
        projectId: 'p_missing',
        sceneId: 's_missing',
        text: 'Testing missing audio output',
        language: 'en',
      })
    ).rejects.toThrow(/Missing audio output/);
  });

  it('throws clear error when returned WAV data is corrupted or too short', async () => {
    mockFetchInteraction({
      id: 'interaction_corrupt',
      steps: [
        {
          type: 'model_output',
          content: [
            {
              type: 'audio',
              data: Buffer.from('short').toString('base64'),
              mime_type: 'audio/wav',
            },
          ],
        },
      ],
    });

    const provider = new GeminiTTSProvider('test_key');
    await expect(
      provider.synthesizeSpeech({
        taskId: 't_corrupt',
        projectId: 'p_corrupt',
        sceneId: 's_corrupt',
        text: 'Testing corrupt audio data',
        language: 'en',
      })
    ).rejects.toThrow(/Invalid WAV data/);
  });
});

describe('Zero-Paid-API Policy in TTSService', () => {
  it('registers Gemini TTS and sets it as default when geminiApiKey is provided', () => {
    const service = new TTSService({ geminiApiKey: 'gemini_secret_123' });
    const provider = service.getProvider();
    expect(provider.id).toBe('gemini_tts');
  });

  it('falls back to local_tts when no API keys are provided', () => {
    const service = new TTSService();
    const provider = service.getProvider();
    expect(provider.id).toBe('local_tts');
  });

  it('never automatically defaults to ElevenLabs when elevenLabsApiKey is provided without explicit selection', () => {
    const service = new TTSService({ elevenLabsApiKey: 'eleven_secret_123' });
    const provider = service.getProvider();
    expect(provider.id).toBe('local_tts');
  });

  it('allows explicit selection of ElevenLabs only when explicitly requested', () => {
    const service = new TTSService({
      elevenLabsApiKey: 'eleven_secret_123',
      defaultProvider: 'elevenlabs',
    });
    const provider = service.getProvider();
    expect(provider.id).toBe('elevenlabs');
  });
});

describe('Narration Failure Propagation in RemotionRendererService', () => {
  const dummyStoryboard: any = {
    title: 'Test Explainer',
    aspectRatio: '9:16',
    fps: 30,
    scenes: [
      {
        id: 'scene_fail_1',
        sceneNumber: 1,
        componentType: 'flowchart',
        header: { actNumber: 1, actTitle: 'Test' },
        narration: 'This narration will fail',
        durationSeconds: 3,
        props: { nodes: [] },
      },
    ],
  };

  it('aborts rendering with an error when TTS fails and allowLocalFallback is false (no silent substitution)', async () => {
    const failingTTSService = {
      getProvider: () => ({ id: 'failing_tts' }),
      synthesize: vi.fn().mockRejectedValue(new Error('Simulated Gemini 404 Failure')),
    } as any;

    const renderer = new RemotionRendererService(failingTTSService);

    await expect(
      renderer.renderExplainerVideo(dummyStoryboard, {
        allowLocalFallback: false,
      })
    ).rejects.toThrow(/Narration synthesis failed for scene 1: Simulated Gemini 404 Failure/);
  });
});
