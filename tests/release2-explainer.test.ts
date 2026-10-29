import { describe, it, expect } from 'vitest';
import {
  validateExplainerComponentProps,
  remotionExplainerComponentTypes,
  type TechnicalExplainerStoryboard,
} from '@creatorflow/shared';
import { TechnicalExplainerPlanner } from '../apps/api/src/planner/explainer-planner.js';
import { LocalSpeechSynthesizer } from '../apps/api/src/providers/tts/local-synthesizer.js';
import { QAEngine } from '../apps/api/src/media/qa-engine.js';
import { RemotionRendererService } from '../apps/api/src/render/remotion-renderer.js';

describe('Release 2: Dynamic Visual Intelligence & Component Reliability', () => {
  const planner = new TechnicalExplainerPlanner();
  const tts = new LocalSpeechSynthesizer();
  const qaEngine = new QAEngine();
  const renderer = new RemotionRendererService();

  describe('Phase 2 & 3: Dynamic Scene Intelligence & Reusable Component Schemas', () => {
    it('registers all 16 Remotion explainer component types', () => {
      expect(remotionExplainerComponentTypes).toHaveLength(16);
      expect(remotionExplainerComponentTypes).toContain('flowchart');
      expect(remotionExplainerComponentTypes).toContain('comparison');
      expect(remotionExplainerComponentTypes).toContain('process_timeline');
      expect(remotionExplainerComponentTypes).toContain('concept_breakdown');
      expect(remotionExplainerComponentTypes).toContain('statistics');
      expect(remotionExplainerComponentTypes).toContain('data_flow');
      expect(remotionExplainerComponentTypes).toContain('ui_walkthrough');
      expect(remotionExplainerComponentTypes).toContain('network_diagram');
      expect(remotionExplainerComponentTypes).toContain('generic_infographic');
    });

    it('plans Authentication vs Authorization using specialized comparative components', async () => {
      const storyboard = await planner.planStoryboard(
        'Authentication vs Authorization in Cloud Systems with RBAC',
        { aspectRatio: '9:16' }
      );

      const componentTypes = storyboard.scenes.map((s) => s.componentType);
      expect(componentTypes).toContain('comparison');
      expect(componentTypes).toContain('flowchart');
      expect(componentTypes).toContain('data_flow');
      expect(componentTypes).toContain('kinetic_typography');

      // Ensure every scene validates against its respective strict schema
      for (const scene of storyboard.scenes) {
        const check = validateExplainerComponentProps(scene.componentType, scene.props);
        expect(check.success).toBe(true);
      }
    });

    it('plans Product Advertisement using UI Walkthrough, Infographic, and Statistics', async () => {
      const storyboard = await planner.planStoryboard(
        'CreatorFlow AI product advertisement and studio launch',
        { aspectRatio: '9:16' }
      );

      const componentTypes = storyboard.scenes.map((s) => s.componentType);
      expect(componentTypes).toContain('ui_walkthrough');
      expect(componentTypes).toContain('statistics');
      expect(componentTypes).toContain('generic_infographic');
      expect(componentTypes).toContain('comparison');

      for (const scene of storyboard.scenes) {
        const check = validateExplainerComponentProps(scene.componentType, scene.props);
        expect(check.success).toBe(true);
      }
    });

    it('gracefully falls back to generic_infographic when component props are corrupted', () => {
      const corruptedStoryboard: TechnicalExplainerStoryboard = {
        topicId: 'CORRUPT_TEST',
        title: 'Corrupted Props Test',
        category: 'test',
        aspectRatio: '9:16',
        fps: 30,
        width: 720,
        height: 1280,
        totalDurationSeconds: 6,
        scenes: [
          {
            id: 'scene_corrupt',
            sceneNumber: 1,
            componentType: 'flowchart',
            durationSeconds: 3,
            narration: 'This flowchart is missing required nodes.',
            subtitles: [],
            header: {
              topicTag: 'TEST',
              channelHandle: '@test',
              actNumber: '01',
              actTitle: 'INVALID FLOW',
            },
            props: {
              // Missing required 'nodes' array
              title: 'Empty flow',
            },
          },
        ],
      };

      const sanitized = planner.validateAndSanitizeStoryboard(corruptedStoryboard);
      expect(sanitized.scenes[0].componentType).toBe('generic_infographic');
      expect(sanitized.scenes[0].props.header.title).toBe('INVALID FLOW');
    });
  });

  describe('Phase 4: Narration & Pronunciation Preprocessing', () => {
    it('normalizes technical acronyms for clear speech synthesis', () => {
      const input = 'AuthN verifies identity and issues JWT via OAuth; AuthZ checks RBAC at 100k QPS on NoSQL API.';
      const normalized = tts.normalizeTechnicalPronunciation(input);

      expect(normalized).toContain('Auth-N');
      expect(normalized).toContain('Auth-Z');
      expect(normalized).toContain('J-W-T');
      expect(normalized).toContain('O-Auth');
      expect(normalized).toContain('Q-P-S');
      expect(normalized).toContain('No-S-Q-L');
      expect(normalized).toContain('A-P-I');
    });

    it('calculates language cadence durations with padding', () => {
      const text = 'This is a sample technical explainer script that tests the pacing calculation.';
      const enDuration = tts.calculateSpeechDuration(text, 'en');
      const hiDuration = tts.calculateSpeechDuration(text, 'hi');
      const hinglishDuration = tts.calculateSpeechDuration(text, 'hinglish');

      expect(enDuration).toBeGreaterThan(1.8);
      expect(hiDuration).toBeGreaterThan(enDuration); // Hindi slower WPM
      expect(hinglishDuration).toBeGreaterThan(enDuration);
      expect(hinglishDuration).toBeLessThan(hiDuration);
    });
  });

  describe('Phase 5: Automated Visual QA & Bounds Checking', () => {
    it('detects subtitle timing inconsistencies and safe area overflow', () => {
      const invalidStoryboard = {
        scenes: [
          {
            sceneNumber: 1,
            durationSeconds: 3.0,
            header: {
              actTitle: 'A'.repeat(95), // Exceeds safe area limit (max 80)
            },
            subtitles: [
              { text: 'Broken timing', startSeconds: 2.5, endSeconds: 2.0 }, // start > end
              { text: 'Overflows duration', startSeconds: 0.5, endSeconds: 4.5 }, // 4.5s > 3.0s scene
            ],
          },
        ],
      };

      const result = qaEngine.validateVisualLayoutAndCaptions(invalidStoryboard);
      expect(result.passed).toBe(false);
      expect(result.issues.some((i) => i.includes('exceeds 9:16 safe area boundary'))).toBe(true);
      expect(result.issues.some((i) => i.includes('start time'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('extends past scene duration'))).toBe(true);
    });
  });

  describe('Phase 6: Intelligent Scene Repair', () => {
    it('isolates and repairs a single scene without mutating other scenes', async () => {
      const initialStoryboard = await planner.planStoryboard(
        'Authentication vs Authorization in Cloud Systems',
        { aspectRatio: '9:16' }
      );

      const originalScene2 = initialStoryboard.scenes[1];
      const originalScene3 = initialStoryboard.scenes[2];

      const repaired = await renderer.repairScene(initialStoryboard, 2, {
        narration: 'Updated narration: New zero-trust validation pipeline.',
      });

      // Scene 2 updated
      expect(repaired.scenes[1].narration).toBe('Updated narration: New zero-trust validation pipeline.');
      expect(repaired.scenes[1].narrationAudioUrl).toBeUndefined(); // invalidated for re-synthesis

      // Scene 3 strictly preserved
      expect(repaired.scenes[2].narration).toBe(originalScene3.narration);
      expect(repaired.scenes[2].componentType).toBe(originalScene3.componentType);
      expect(repaired.scenes[0].componentType).toBe(initialStoryboard.scenes[0].componentType);
    });
  });
});
