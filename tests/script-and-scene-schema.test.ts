import { describe, expect, it } from 'vitest';
import {
  scriptSchema,
  updateScriptSchema,
  universalSceneSchema,
  universalScenePlanSchema,
  updateScenePlanSchema,
  universalTimelineSchema,
  type ScriptData,
  type UniversalScenePlanData,
} from '@creatorflow/shared';

describe('Universal Video Platform Contracts', () => {
  const validScript: ScriptData = {
    title: 'ट्रैफिक जाम क्यों होता है?',
    hook: 'क्या आपने कभी सोचा है कि बिना किसी दुर्घटना के भी लंबा ट्रैफिक जाम क्यों लग जाता है?',
    totalDurationSeconds: 60,
    scenes: [
      {
        sceneNumber: 1,
        title: 'द हुक (The Hook)',
        narration: 'कल्पना कीजिए, आप हाइवे पर 60 की रफ्तार से चल रहे हैं और अचानक गाड़ियां रुक जाती हैं।',
        visualDescription: 'Wide angle shot of moving 3D vehicles on a straight highway before slowdown.',
        durationSeconds: 15,
      },
      {
        sceneNumber: 2,
        title: 'द बॉटलनेक (The Bottleneck)',
        narration: 'आगे कोई एक्सीडेंट नहीं है, बस किसी एक ड्राइवर ने बेवजह हल्का सा ब्रेक दबाया था।',
        visualDescription: 'Top-down camera showing one red car braking slightly, creating a compression ripple.',
        durationSeconds: 20,
      },
      {
        sceneNumber: 3,
        title: 'फैंटम ट्रैफिक वेव (Phantom Traffic Wave)',
        narration: 'इस छोटी सी रुकावट ने पीछे की हर गाड़ी को और जोर से ब्रेक लगाने पर मजबूर कर दिया। इसे फैंटम ट्रैफिक कहते हैं।',
        visualDescription: 'Cinematic orbit camera tracking the backwards wave of stopped vehicles.',
        durationSeconds: 15,
      },
      {
        sceneNumber: 4,
        title: 'समाधान (The Solution)',
        narration: 'अगर सभी गाड़ियां बराबर दूरी बनाकर चलें, तो यह जाम कभी नहीं बनेगा। सुरक्षित चलें!',
        visualDescription: 'Camera pulls back as traffic smoothly flows again across the intersection.',
        durationSeconds: 10,
      },
    ],
  };

  it('validates a complete Hindi script with Unicode content', () => {
    const parsed = scriptSchema.parse(validScript);
    expect(parsed.scenes).toHaveLength(4);
    expect(parsed.scenes[0].narration).toContain('हाइवे');
    expect(parsed.totalDurationSeconds).toBe(60);
  });

  it('rejects scripts with invalid scene counts or bounds', () => {
    expect(scriptSchema.safeParse({ ...validScript, scenes: [] }).success).toBe(false);
    expect(scriptSchema.safeParse({ ...validScript, totalDurationSeconds: 5 }).success).toBe(false);
    expect(scriptSchema.safeParse({ ...validScript, totalDurationSeconds: 200 }).success).toBe(false);
  });

  it('requires expectedVersion for script updates', () => {
    expect(updateScriptSchema.safeParse(validScript).success).toBe(false);
    expect(updateScriptSchema.safeParse({ ...validScript, expectedVersion: 1 }).success).toBe(true);
  });

  const universalMultiStrategyPlan: UniversalScenePlanData = {
    totalDurationSeconds: 45,
    scenes: [
      {
        id: 'scene_001',
        sceneNumber: 1,
        sceneType: 'title_intro',
        durationSeconds: 10,
        visualDescription: 'Kinetic title sequence with animated geometric shapes.',
        renderStrategy: {
          type: 'motion_graphics',
          headline: 'THE SCIENCE OF TRAFFIC',
          subheadline: 'How small delays cause massive gridlock',
          style: 'bold_minimal',
          primaryColor: '#1e1b4b',
          accentColor: '#6366f1',
          backgroundAnimation: 'subtle_grid',
        },
        audio: {
          narrationEnabled: true,
          text: 'Have you ever been stuck in traffic wondering why it started?',
          language: 'en',
          volume: 1,
        },
        subtitles: [
          { text: 'Have you ever been stuck in traffic wondering why it started?', startSeconds: 0, endSeconds: 10 },
        ],
        textOverlays: [
          { text: 'Episode 01', position: 'top', startSeconds: 0, endSeconds: 10 },
        ],
        transition: 'fade',
      },
      {
        id: 'scene_002',
        sceneNumber: 2,
        sceneType: 'procedural_simulation',
        durationSeconds: 20,
        visualDescription: '3D simulation of highway cars showing braking ripple effect.',
        renderStrategy: {
          type: 'procedural_3d',
          template: 'traffic_intersection',
          camera: {
            type: 'top_down',
            zoom: 1.4,
            angleDegrees: 0,
          },
          parameters: {
            density: 'congested',
            vehicleCount: 42,
            averageSpeed: 18,
            trafficSignalState: 'yellow',
          },
          deterministicSeed: 9876543,
        },
        audio: {
          narrationEnabled: true,
          text: 'One car brakes slightly, causing a backwards shockwave.',
          language: 'en',
          volume: 1,
        },
        subtitles: [
          { text: 'One car brakes slightly, causing a backwards shockwave.', startSeconds: 0, endSeconds: 20 },
        ],
        textOverlays: [],
        transition: 'cut',
      },
      {
        id: 'scene_003',
        sceneNumber: 3,
        sceneType: 'b_roll_footage',
        durationSeconds: 15,
        visualDescription: 'User uploaded product photo with Ken Burns pan motion and music only (no voiceover).',
        renderStrategy: {
          type: 'uploaded_media',
          assetId: 'asset_prod_778',
          mediaType: 'image',
          fit: 'cover',
          motion: 'ken_burns',
        },
        audio: {
          narrationEnabled: false,
          volume: 0,
        },
        subtitles: [],
        textOverlays: [
          { text: 'Drive Smarter Today', position: 'lower_third', startSeconds: 0, endSeconds: 15 },
        ],
        transition: 'dissolve',
      },
    ],
  };

  it('validates a multi-strategy universal scene plan with mixed render types and optional narration', () => {
    const parsed = universalScenePlanSchema.parse(universalMultiStrategyPlan);
    expect(parsed.scenes).toHaveLength(3);
    expect(parsed.scenes[0].renderStrategy.type).toBe('motion_graphics');
    expect(parsed.scenes[1].renderStrategy.type).toBe('procedural_3d');
    expect(parsed.scenes[2].renderStrategy.type).toBe('uploaded_media');
    expect(parsed.scenes[2].audio.narrationEnabled).toBe(false);
  });

  it('validates multitrack universal timeline structure', () => {
    const timeline = universalTimelineSchema.parse({
      projectId: 'proj_12345',
      aspectRatio: '16:9',
      totalDurationSeconds: 45,
      tracks: [
        {
          trackId: 'track_video_0',
          name: 'Main Visual Track',
          type: 'video',
          clips: [
            { id: 'clip_v1', sceneId: 'scene_001', startSeconds: 0, endSeconds: 10, content: { strategy: 'motion_graphics' } },
            { id: 'clip_v2', sceneId: 'scene_002', startSeconds: 10, endSeconds: 30, content: { strategy: 'procedural_3d' } },
            { id: 'clip_v3', sceneId: 'scene_003', startSeconds: 30, endSeconds: 45, content: { strategy: 'uploaded_media' } },
          ],
        },
        {
          trackId: 'track_audio_music',
          name: 'Background Music Track',
          type: 'audio_music',
          clips: [
            { id: 'clip_m1', sceneId: 'all', startSeconds: 0, endSeconds: 45, content: { trackUrl: '/audio/bg.mp3', ducking: true } },
          ],
        },
      ],
    });

    expect(timeline.tracks).toHaveLength(2);
    expect(timeline.totalDurationSeconds).toBe(45);
  });

  it('rejects invalid render strategy combinations', () => {
    // Missing required fields for motion graphics
    expect(
      universalSceneSchema.safeParse({
        id: 's_bad',
        sceneNumber: 1,
        durationSeconds: 10,
        visualDescription: 'bad',
        renderStrategy: {
          type: 'motion_graphics',
          // headline missing
        },
      }).success,
    ).toBe(false);

    // Out of bounds camera zoom
    expect(
      universalSceneSchema.safeParse({
        id: 's_bad',
        sceneNumber: 1,
        durationSeconds: 10,
        visualDescription: 'bad',
        renderStrategy: {
          type: 'procedural_3d',
          template: 'traffic_intersection',
          camera: { type: 'orbit', zoom: 15, angleDegrees: 0 },
          parameters: {},
          deterministicSeed: 100,
        },
      }).success,
    ).toBe(false);
  });

  it('requires expectedVersion for scene plan updates', () => {
    expect(updateScenePlanSchema.safeParse(universalMultiStrategyPlan).success).toBe(false);
    expect(updateScenePlanSchema.safeParse({ ...universalMultiStrategyPlan, expectedVersion: 1 }).success).toBe(true);
  });
});
