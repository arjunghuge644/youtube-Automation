import {
  scriptSchema,
  scenePlanSchema,
  storyboardSchema,
  type Project,
  type ScriptData,
  type ScenePlanData,
  type PlannedScene,
  type StoryboardData,
  type StoryboardScene,
  type SubtitleItem,
} from '@creatorflow/shared';
import type { Planner } from './types.js';

interface NarrativeTemplate {
  hook: { hi: string; en: string; hinglish: string };
  scenes: Array<{
    title: { hi: string; en: string; hinglish: string };
    narration: { hi: string; en: string; hinglish: string };
    visualDescription: string;
    camera: { type: 'orbit' | 'top_down' | 'driver_view' | 'cinematic'; zoom: number; angleDegrees: number };
    traffic: { density: 'light' | 'moderate' | 'congested' | 'gridlock'; vehicleCount: number; averageSpeed: number; trafficSignalState: 'green' | 'yellow' | 'red' | 'all_red' };
    transition: 'fade' | 'cut' | 'slide_left' | 'dissolve';
  }>;
}

const trafficNarrative: NarrativeTemplate = {
  hook: {
    hi: 'क्या आपने कभी सोचा है कि बिना किसी दुर्घटना के भी अचानक लंबा ट्रैफिक जाम क्यों लग जाता है?',
    en: 'Have you ever wondered why traffic jams suddenly appear even when there is no accident ahead?',
    hinglish: 'Kya aapne kabhi socha hai ki bina kisi accident ke bhi achanak lamba traffic jam kaise lag jata hai?',
  },
  scenes: [
    {
      title: {
        hi: 'शुरुआत: सामान्य आवागमन',
        en: 'The Flow: Normal Traffic',
        hinglish: 'Introduction: Normal Traffic Flow',
      },
      narration: {
        hi: 'कल्पना कीजिए, आप एक व्यस्त चौराहे की ओर सामान्य गति से आगे बढ़ रहे हैं, जहां गाड़ियां सुचारू रूप से चल रही हैं।',
        en: 'Imagine you are cruising towards a busy city intersection at normal speed, where traffic flows smoothly.',
        hinglish: 'Imagine kijiye, aap ek busy intersection ki taraf normal speed se ja rahe hain jahan traffic smoothly chal raha hai.',
      },
      visualDescription: 'Cinematic wide camera view of stylized 3D vehicles traveling across an urban multi-lane intersection.',
      camera: { type: 'cinematic', zoom: 1.1, angleDegrees: 30 },
      traffic: { density: 'moderate', vehicleCount: 26, averageSpeed: 48, trafficSignalState: 'green' },
      transition: 'fade',
    },
    {
      title: {
        hi: 'बॉटलनेक: छोटी सी रुकावट',
        en: 'The Bottleneck: A Tap on the Brakes',
        hinglish: 'The Trigger: Sudden Braking',
      },
      narration: {
        hi: 'आगे कोई रुकावट नहीं है, बस एक ड्राइवर ने ज़रा सी असावधानी में अचानक ब्रेक दबा दिया, जिससे पीछे वाले को और तेज ब्रेक लगाना पड़ा।',
        en: 'There is no obstacle ahead; just one driver braking slightly too hard, forcing the driver behind to brake even harder.',
        hinglish: 'Aage koi road obstruction nahi hai; bas ek car ne achanak brake lagaya, jisse peeche wali car ko zor se brake lagana pada.',
      },
      visualDescription: 'Top-down bird eye view highlighting a leading vehicle braking and creating an initial compression ripple.',
      camera: { type: 'top_down', zoom: 1.4, angleDegrees: 0 },
      traffic: { density: 'congested', vehicleCount: 46, averageSpeed: 20, trafficSignalState: 'yellow' },
      transition: 'cut',
    },
    {
      title: {
        hi: 'फैंटम ट्रैफिक वेव',
        en: 'The Phantom Traffic Wave',
        hinglish: 'The Phantom Wave Reaction',
      },
      narration: {
        hi: 'इसे फैंटम ट्रैफिक वेव कहते हैं। यह ब्रेक की लहर पीछे की ओर फैलती जाती है और देखते ही देखते सैकड़ों गाड़ियां थम जाती हैं।',
        en: 'This is called a phantom traffic wave. The braking ripple multiplies backward, bringing dozens of vehicles to a complete stop.',
        hinglish: 'Ise phantom traffic wave kehte hain. Yeh braking ripple peeche multiply hota hai aur dekhte hi dekhte gridlock ho jata hai.',
      },
      visualDescription: 'Slow orbiting camera displaying the backward shockwave traveling through rows of stopped vehicles.',
      camera: { type: 'orbit', zoom: 1.3, angleDegrees: -45 },
      traffic: { density: 'gridlock', vehicleCount: 68, averageSpeed: 5, trafficSignalState: 'red' },
      transition: 'dissolve',
    },
    {
      title: {
        hi: 'समाधान: सुरक्षित दूरी',
        en: 'The Solution: Maintain Distance',
        hinglish: 'The Fix: Safe Following Distance',
      },
      narration: {
        hi: 'अगर हर चालक आगे वाली गाड़ी से 3 सेकंड की सुरक्षित दूरी रखे, तो यह शॉकवेव कभी नहीं बनेगी। सुरक्षित चलें!',
        en: 'If every driver maintains a 3-second safe following distance, the wave absorbs naturally. Drive smart and stay safe!',
        hinglish: 'Agar har driver 3-second safe distance maintain kare, toh yeh shockwave absorb ho jayegi. Safe drive kijiye!',
      },
      visualDescription: 'Elevated perspective showing vehicles maintaining even gaps as traffic resumes fluid movement.',
      camera: { type: 'cinematic', zoom: 1.0, angleDegrees: 15 },
      traffic: { density: 'light', vehicleCount: 20, averageSpeed: 42, trafficSignalState: 'green' },
      transition: 'fade',
    },
  ],
};

function splitDuration(totalSeconds: number, sceneCount: number): number[] {
  const base = Math.floor(totalSeconds / sceneCount);
  const remainder = totalSeconds % sceneCount;
  const durations = Array(sceneCount).fill(base);
  for (let i = 0; i < remainder; i++) {
    durations[i % sceneCount] += 1;
  }
  return durations;
}

function generateSubtitles(text: string, durationSeconds: number): SubtitleItem[] {
  const sentences = text
    .split(/(?<=[।!?.\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return [{ text, startSeconds: 0, endSeconds: durationSeconds }];
  }

  const chunkDuration = Number((durationSeconds / sentences.length).toFixed(1));
  const subtitles: SubtitleItem[] = [];

  for (let i = 0; i < sentences.length; i++) {
    const start = Number((i * chunkDuration).toFixed(1));
    const end = i === sentences.length - 1 ? durationSeconds : Number(((i + 1) * chunkDuration).toFixed(1));
    subtitles.push({
      text: sentences[i],
      startSeconds: start,
      endSeconds: end,
    });
  }
  return subtitles;
}

function computeDeterministicSeed(projectId: string, sceneNumber: number): number {
  let hash = 2166136261;
  const str = `${projectId}:${sceneNumber}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (Math.abs(hash) % 2000000000) + 1;
}

export class LocalDeterministicPlanner implements Planner {
  async generateScript(project: Project): Promise<ScriptData> {
    const lang = project.language;
    const template = trafficNarrative;
    const sceneCount = template.scenes.length;
    const durations = splitDuration(project.durationSeconds, sceneCount);

    const script: ScriptData = {
      title: project.title || (lang === 'hi' ? 'ट्रैफिक जाम क्यों होता है?' : 'Why Traffic Jams Happen'),
      hook: template.hook[lang] || template.hook.hi,
      totalDurationSeconds: project.durationSeconds,
      scenes: template.scenes.map((scene, index) => ({
        sceneNumber: index + 1,
        title: scene.title[lang] || scene.title.hi,
        narration: scene.narration[lang] || scene.narration.hi,
        visualDescription: scene.visualDescription,
        durationSeconds: durations[index],
      })),
    };

    return scriptSchema.parse(script);
  }

  async generateScenePlan(project: Project, script: ScriptData): Promise<ScenePlanData> {
    const lang = project.language;
    const template = trafficNarrative;

    const scenes: PlannedScene[] = script.scenes.map((scene, index) => {
      const templateScene = template.scenes[index % template.scenes.length];
      const durationSeconds = scene.durationSeconds;
      const subtitles = generateSubtitles(scene.narration, durationSeconds);

      return {
        id: `scene_${scene.sceneNumber}`,
        sceneNumber: scene.sceneNumber,
        sceneType: 'procedural_simulation',
        durationSeconds,
        visualDescription: scene.visualDescription,
        renderStrategy: {
          type: 'procedural_3d',
          template: 'traffic_intersection',
          camera: { ...templateScene.camera },
          parameters: { ...templateScene.traffic },
          deterministicSeed: computeDeterministicSeed(project.id, scene.sceneNumber),
        },
        audio: {
          narrationEnabled: project.narrationEnabled,
          text: scene.narration,
          language: lang,
          volume: 1,
        },
        subtitles,
        textOverlays: [],
        transition: templateScene.transition,
      };
    });

    const plan: ScenePlanData = {
      totalDurationSeconds: script.totalDurationSeconds,
      scenes,
    };

    return scenePlanSchema.parse(plan);
  }

  async generateStoryboard(project: Project, script: ScriptData): Promise<StoryboardData> {
    const scenes: StoryboardScene[] = script.scenes.map((scene) => ({
      sceneNumber: scene.sceneNumber,
      title: scene.title,
      durationSeconds: scene.durationSeconds,
      visualDescription: scene.visualDescription,
      cameraMotion: 'cinematic slow pan',
      lighting: 'natural cinematic lighting',
      providerPrompt: `${scene.visualDescription}, natural lighting, cinematic 8k quality`,
      negativePrompt: 'blurry, low quality, artifacts',
      narrationText: scene.narration,
      narrationEnabled: project.narrationEnabled,
      suggestedProvider: 'google_flow',
      aspectRatio: project.aspectRatio || '9:16',
    }));

    return storyboardSchema.parse({
      projectId: project.id,
      title: `${script.title} — Storyboard`,
      scenes,
      totalDurationSeconds: script.totalDurationSeconds,
    });
  }
}

