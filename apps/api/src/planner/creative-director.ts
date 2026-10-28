import {
  scriptSchema,
  universalScenePlanSchema,
  storyboardSchema,
  type Project,
  type ScriptData,
  type UniversalScenePlanData,
  type UniversalScene,
  type StoryboardData,
  type StoryboardScene,
  type SubtitleItem,
  type VideoCategory,
} from '@creatorflow/shared';
import type { Planner } from './types.js';

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
  if (!text.trim()) return [];
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

export class CreativeDirector implements Planner {
  detectCategory(prompt: string, explicitCategory?: VideoCategory): VideoCategory {
    if (explicitCategory && explicitCategory !== 'custom') return explicitCategory;
    const lower = prompt.toLowerCase();
    if (lower.includes('product') || lower.includes('promo') || lower.includes('sale') || lower.includes('buy') || lower.includes('watch') || lower.includes('coffee') || lower.includes('shoe') || lower.includes('commercial')) {
      return 'product_promo';
    }
    if (lower.includes('documentary') || lower.includes('history') || lower.includes('nature') || lower.includes('wildlife') || lower.includes('ocean') || lower.includes('forest') || lower.includes('planet')) {
      return 'documentary';
    }
    if (lower.includes('story') || lower.includes('tale') || lower.includes('journey') || lower.includes('once upon')) {
      return 'storytelling';
    }
    if (lower.includes('short') || lower.includes('reel') || lower.includes('tiktok') || lower.includes('viral')) {
      return 'social_short';
    }
    return 'educational';
  }

  async generateScript(project: Project): Promise<ScriptData> {
    const category = this.detectCategory(project.prompt, project.category);
    const lang = project.language;
    const duration = project.durationSeconds;

    if (category === 'product_promo') {
      return this.generateProductPromoScript(project, duration, lang);
    }
    if (category === 'documentary') {
      return this.generateDocumentaryScript(project, duration, lang);
    }
    // Default / Educational Animation
    return this.generateEducationalScript(project, duration, lang);
  }

  async generateScenePlan(project: Project, script: ScriptData): Promise<UniversalScenePlanData> {
    const category = this.detectCategory(project.prompt, project.category);
    const lang = project.language;

    if (category === 'product_promo') {
      return this.generateProductPromoScenes(project, script);
    }
    if (category === 'documentary') {
      return this.generateDocumentaryScenes(project, script, lang);
    }
    return this.generateEducational3DScenes(project, script, lang);
  }

  async generateStoryboard(project: Project, script: ScriptData): Promise<StoryboardData> {
    const category = this.detectCategory(project.prompt, project.category);
    const cameraMotions = ['cinematic slow pan', 'dynamic tracking push-in', 'subtle orbital sweep', 'aerial perspective pull-back'];
    const lightings = ['warm golden hour sunlight', 'volumetric atmospheric rim lighting', 'soft natural diffused daylight', 'crisp cinematic studio light'];

    const scenes: StoryboardScene[] = script.scenes.map((scene, idx) => {
      const cameraMotion = cameraMotions[idx % cameraMotions.length];
      const lighting = lightings[idx % lightings.length];
      const providerPrompt = `${scene.visualDescription}, ${lighting}, ${cameraMotion}, 8k resolution, cinematic color grading, master shot, sharp focus, hyper-realistic detail`;

      return {
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        durationSeconds: scene.durationSeconds,
        visualDescription: scene.visualDescription,
        cameraMotion,
        lighting,
        providerPrompt,
        negativePrompt: 'blurry, low quality, artifacts, watermark, logo, text, distorted, oversaturated',
        narrationText: scene.narration,
        narrationEnabled: project.narrationEnabled,
        suggestedProvider: 'google_flow',
        aspectRatio: project.aspectRatio || '9:16',
      };
    });

    return storyboardSchema.parse({
      projectId: project.id,
      title: `${script.title} — Storyboard`,
      scenes,
      totalDurationSeconds: script.totalDurationSeconds,
    });
  }

  // Test A: Educational 3D Simulation
  private generateEducationalScript(project: Project, totalSeconds: number, lang: 'hi' | 'en' | 'hinglish'): ScriptData {
    const isHindi = lang === 'hi';
    const isHinglish = lang === 'hinglish';
    const durations = splitDuration(totalSeconds, 4);

    return scriptSchema.parse({
      title: project.title || (isHindi ? 'ट्रैफिक जाम क्यों होता है?' : 'Why Traffic Jams Happen'),
      hook: isHindi
        ? 'क्या आपने कभी सोचा है कि बिना किसी दुर्घटना के भी अचानक लंबा ट्रैफिक जाम क्यों लग जाता है?'
        : isHinglish
        ? 'Kya aapne kabhi socha hai ki bina kisi accident ke bhi achanak lamba traffic jam kaise lag jata hai?'
        : 'Have you ever wondered why traffic jams appear out of nowhere without any accident?',
      totalDurationSeconds: totalSeconds,
      scenes: [
        {
          sceneNumber: 1,
          title: isHindi ? 'शुरुआत: सामान्य आवागमन' : isHinglish ? 'Introduction: Normal Flow' : 'The Flow: Normal Traffic',
          narration: isHindi
            ? 'कल्पना कीजिए, आप एक व्यस्त चौराहे की ओर सामान्य गति से आगे बढ़ रहे हैं, जहां गाड़ियां सुचारू रूप से चल रही हैं।'
            : isHinglish
            ? 'Imagine kijiye, aap ek busy intersection ki taraf normal speed se ja rahe hain jahan traffic smoothly chal raha hai.'
            : 'Imagine you are cruising towards a busy city intersection at normal speed, where traffic flows smoothly.',
          visualDescription: 'Cinematic wide camera view of stylized 3D vehicles traveling across an urban multi-lane intersection.',
          durationSeconds: durations[0],
        },
        {
          sceneNumber: 2,
          title: isHindi ? 'बॉटलनेक: छोटी सी रुकावट' : isHinglish ? 'The Trigger: Sudden Braking' : 'The Trigger: A Tap on the Brakes',
          narration: isHindi
            ? 'आगे कोई रुकावट नहीं है, बस एक ड्राइवर ने ज़रा सी असावधानी में अचानक ब्रेक दबा दिया, जिससे पीछे वाले को और तेज ब्रेक लगाना पड़ा।'
            : isHinglish
            ? 'Aage koi road obstruction nahi hai; bas ek car ne achanak brake lagaya, jisse peeche wali car ko zor se brake lagana pada.'
            : 'There is no obstacle ahead; just one driver braking slightly too hard, forcing the driver behind to brake even harder.',
          visualDescription: 'Top-down bird eye view highlighting a leading vehicle braking and creating an initial compression ripple.',
          durationSeconds: durations[1],
        },
        {
          sceneNumber: 3,
          title: isHindi ? 'फैंटम ट्रैफिक वेव' : isHinglish ? 'The Phantom Wave Reaction' : 'The Phantom Traffic Wave',
          narration: isHindi
            ? 'इसे फैंटम ट्रैफिक वेव कहते हैं। यह ब्रेक की लहर पीछे की ओर फैलती जाती है और देखते ही देखते सैकड़ों गाड़ियां थम जाती हैं।'
            : isHinglish
            ? 'Ise phantom traffic wave kehte hain. Yeh braking ripple peeche multiply hota hai aur dekhte hi dekhte gridlock ho jata hai.'
            : 'This is called a phantom traffic wave. The braking ripple multiplies backward, bringing dozens of vehicles to a complete stop.',
          visualDescription: 'Slow orbiting camera displaying the backward shockwave traveling through rows of stopped vehicles.',
          durationSeconds: durations[2],
        },
        {
          sceneNumber: 4,
          title: isHindi ? 'समाधान: सुरक्षित दूरी' : isHinglish ? 'The Fix: Safe Following Distance' : 'The Solution: Maintain Distance',
          narration: isHindi
            ? 'अगर हर चालक आगे वाली गाड़ी से 3 सेकंड की सुरक्षित दूरी रखे, तो यह शॉकवेव कभी नहीं बनेगी। सुरक्षित चलें!'
            : isHinglish
            ? 'Agar har driver 3-second safe distance maintain kare, toh yeh shockwave absorb ho jayegi. Safe drive kijiye!'
            : 'If every driver maintains a 3-second safe following distance, the wave absorbs naturally. Drive smart and stay safe!',
          visualDescription: 'Elevated perspective showing vehicles maintaining even gaps as traffic resumes fluid movement.',
          durationSeconds: durations[3],
        },
      ],
    });
  }

  private generateEducational3DScenes(project: Project, script: ScriptData, lang: 'hi' | 'en' | 'hinglish'): UniversalScenePlanData {
    const scenes: UniversalScene[] = script.scenes.map((scene, idx) => {
      const cameraConfigs = [
        { type: 'cinematic' as const, zoom: 1.1, angleDegrees: 30 },
        { type: 'top_down' as const, zoom: 1.4, angleDegrees: 0 },
        { type: 'orbit' as const, zoom: 1.3, angleDegrees: -45 },
        { type: 'cinematic' as const, zoom: 1.0, angleDegrees: 15 },
      ];
      const trafficConfigs = [
        { density: 'moderate' as const, vehicleCount: 26, averageSpeed: 48, trafficSignalState: 'green' as const },
        { density: 'congested' as const, vehicleCount: 46, averageSpeed: 20, trafficSignalState: 'yellow' as const },
        { density: 'gridlock' as const, vehicleCount: 68, averageSpeed: 5, trafficSignalState: 'red' as const },
        { density: 'light' as const, vehicleCount: 20, averageSpeed: 42, trafficSignalState: 'green' as const },
      ];

      return {
        id: `scene_${scene.sceneNumber}`,
        sceneNumber: scene.sceneNumber,
        sceneType: 'procedural_simulation',
        durationSeconds: scene.durationSeconds,
        visualDescription: scene.visualDescription,
        renderStrategy: {
          type: 'procedural_3d',
          template: 'traffic_intersection',
          camera: cameraConfigs[idx % cameraConfigs.length],
          parameters: trafficConfigs[idx % trafficConfigs.length],
          deterministicSeed: computeDeterministicSeed(project.id, scene.sceneNumber),
        },
        audio: {
          narrationEnabled: project.narrationEnabled,
          text: scene.narration,
          language: lang,
          volume: 1,
        },
        subtitles: generateSubtitles(scene.narration, scene.durationSeconds),
        textOverlays: [],
        transition: idx === 0 ? 'fade' : idx === 1 ? 'cut' : idx === 2 ? 'dissolve' : 'fade',
      };
    });

    return universalScenePlanSchema.parse({
      totalDurationSeconds: script.totalDurationSeconds,
      scenes,
    });
  }

  // Test B: Documentary Video
  private generateDocumentaryScript(project: Project, totalSeconds: number, lang: 'hi' | 'en' | 'hinglish'): ScriptData {
    const durations = splitDuration(totalSeconds, 3);
    const isHindi = lang === 'hi';

    return scriptSchema.parse({
      title: project.title || (isHindi ? 'प्रकृति का रहस्य' : 'Wonders of the Living Ocean'),
      hook: isHindi
        ? 'महासागर की अतल गहराइयों में एक ऐसी दुनिया छिपी है जो हमारी कल्पना से भी परे है।'
        : 'Deep beneath the ocean surface lies a hidden living kingdom older than the earliest trees on Earth.',
      totalDurationSeconds: totalSeconds,
      scenes: [
        {
          sceneNumber: 1,
          title: isHindi ? 'अपरिचित गहराइयां' : 'The Sunlit Shallows',
          narration: isHindi
            ? 'सूरज की किरणें जहां तक पहुंचती हैं, वहां समुद्री प्रवाल भित्तियां पृथ्वी की सबसे जीवंत जैव विविधता को संजोती हैं।'
            : 'In the sunlit shallows, coral reefs host more than twenty-five percent of all marine species.',
          visualDescription: 'Vibrant documentary b-roll framing colorful coral formations bathed in sun rays.',
          durationSeconds: durations[0],
        },
        {
          sceneNumber: 2,
          title: isHindi ? 'सहजीवन का तंत्र' : 'An Ecosystem in Balance',
          narration: isHindi
            ? 'हर छोटा जीव, हर मछली इस विशाल पारिस्थितिकी तंत्र को संतुलित रखने में अपनी महत्वपूर्ण भूमिका निभाती है।'
            : 'From tiny cleaner wrasse to massive sea turtles, every inhabitant maintains the delicate ecological balance.',
          visualDescription: 'Slow cinematic tracking footage highlighting diverse sea life navigating reef arches.',
          durationSeconds: durations[1],
        },
        {
          sceneNumber: 3,
          title: isHindi ? 'संरक्षण का संदेश' : 'Preserving Our Oceans',
          narration: isHindi
            ? 'इस अनमोल संसार को बचाना आज हमारी सबसे बड़ी जिम्मेदारी है। प्रकृति से जुड़े रहें।'
            : 'Protecting these underwater sanctuaries ensures the future of our living planet for generations to come.',
          visualDescription: 'Sweeping wide panoramic view pulling back into the ocean horizon at dusk.',
          durationSeconds: durations[2],
        },
      ],
    });
  }

  private generateDocumentaryScenes(project: Project, script: ScriptData, lang: 'hi' | 'en' | 'hinglish'): UniversalScenePlanData {
    const scenes: UniversalScene[] = script.scenes.map((scene, idx) => ({
      id: `doc_scene_${scene.sceneNumber}`,
      sceneNumber: scene.sceneNumber,
      sceneType: 'documentary_b_roll',
      durationSeconds: scene.durationSeconds,
      visualDescription: scene.visualDescription,
      renderStrategy: {
        type: 'uploaded_media',
        assetId: `doc_asset_00${idx + 1}`,
        mediaType: 'image',
        fit: 'cover',
        motion: idx % 2 === 0 ? 'ken_burns' : 'pan_left',
      },
      audio: {
        narrationEnabled: project.narrationEnabled,
        text: scene.narration,
        language: lang,
        volume: 1,
      },
      subtitles: generateSubtitles(scene.narration, scene.durationSeconds),
      textOverlays: [
        {
          text: idx === 0 ? 'CHAPTER 1: THE REEF' : idx === 1 ? 'SYMBIOSIS' : 'OUR PLANET',
          position: 'lower_third',
          startSeconds: 1,
          endSeconds: Math.min(scene.durationSeconds, 6),
        },
      ],
      transition: 'dissolve',
    }));

    return universalScenePlanSchema.parse({
      totalDurationSeconds: script.totalDurationSeconds,
      scenes,
    });
  }

  // Test C: Product Promotion
  private generateProductPromoScript(project: Project, totalSeconds: number, lang: 'hi' | 'en' | 'hinglish'): ScriptData {
    const durations = splitDuration(totalSeconds, 3);
    const isHindi = lang === 'hi';

    return scriptSchema.parse({
      title: project.title || (isHindi ? 'नया उत्पाद अनावरण' : 'NextGen Headphones Launch'),
      hook: isHindi
        ? 'ध्वनि का ऐसा अनुभव, जो आपने पहले कभी महसूस नहीं किया होगा।'
        : 'Engineered for pure sound. Designed for effortless all-day focus.',
      totalDurationSeconds: totalSeconds,
      scenes: [
        {
          sceneNumber: 1,
          title: 'Brand Hook & Logo Intro',
          narration: project.narrationEnabled ? (isHindi ? 'मिलिए नई ध्वनि क्रांति से।' : 'Meet the next evolution in audio clarity.') : '',
          visualDescription: 'Dynamic animated brand mark and bold kinetic typography typography.',
          durationSeconds: durations[0],
        },
        {
          sceneNumber: 2,
          title: 'Product Beauty Showcase',
          narration: project.narrationEnabled ? (isHindi ? 'सटीक बनावट, सक्रिय शोर नियंत्रण।' : 'Active acoustic cancellation in aerospace-grade titanium.') : '',
          visualDescription: 'Floating product hero angle with cinematic slow push-in zoom.',
          durationSeconds: durations[1],
        },
        {
          sceneNumber: 3,
          title: 'Call to Action & Limited Release',
          narration: project.narrationEnabled ? (isHindi ? 'आज ही ऑर्डर करें।' : 'Available now worldwide. Discover sound redefined.') : '',
          visualDescription: 'High contrast call-to-action motion graphics with promotional discount badge.',
          durationSeconds: durations[2],
        },
      ],
    });
  }

  private generateProductPromoScenes(project: Project, script: ScriptData): UniversalScenePlanData {
    const scenes: UniversalScene[] = [
      {
        id: 'promo_scene_1',
        sceneNumber: 1,
        sceneType: 'title_intro',
        durationSeconds: script.scenes[0].durationSeconds,
        visualDescription: script.scenes[0].visualDescription,
        renderStrategy: {
          type: 'motion_graphics',
          headline: 'AUDIO REDEFINED',
          subheadline: 'Acoustic Precision Engineering',
          style: 'bold_minimal',
          primaryColor: '#0b0c10',
          accentColor: '#6366f1',
          backgroundAnimation: 'geometric_pulse',
        },
        audio: {
          narrationEnabled: project.narrationEnabled,
          text: script.scenes[0].narration,
          volume: 1,
        },
        subtitles: generateSubtitles(script.scenes[0].narration, script.scenes[0].durationSeconds),
        textOverlays: [
          { text: 'NEXTGEN SOUND', position: 'top', startSeconds: 0, endSeconds: script.scenes[0].durationSeconds },
        ],
        transition: 'cut',
      },
      {
        id: 'promo_scene_2',
        sceneNumber: 2,
        sceneType: 'product_showcase',
        durationSeconds: script.scenes[1].durationSeconds,
        visualDescription: script.scenes[1].visualDescription,
        renderStrategy: {
          type: 'uploaded_media',
          assetId: 'promo_hero_product',
          mediaType: 'image',
          fit: 'contain',
          motion: 'zoom_in',
        },
        audio: {
          narrationEnabled: project.narrationEnabled,
          text: script.scenes[1].narration,
          volume: 1,
        },
        subtitles: generateSubtitles(script.scenes[1].narration, script.scenes[1].durationSeconds),
        textOverlays: [
          { text: 'AEROSPACE GRADE TITANIUM', position: 'lower_third', startSeconds: 1, endSeconds: script.scenes[1].durationSeconds },
        ],
        transition: 'slide_left',
      },
      {
        id: 'promo_scene_3',
        sceneNumber: 3,
        sceneType: 'call_to_action',
        durationSeconds: script.scenes[2].durationSeconds,
        visualDescription: script.scenes[2].visualDescription,
        renderStrategy: {
          type: 'motion_graphics',
          headline: 'ORDER YOURS TODAY',
          subheadline: 'Free Global Express Shipping',
          style: 'product_card',
          primaryColor: '#12141a',
          accentColor: '#10b981',
          backgroundAnimation: 'particles',
        },
        audio: {
          narrationEnabled: project.narrationEnabled,
          text: script.scenes[2].narration,
          volume: 1,
        },
        subtitles: generateSubtitles(script.scenes[2].narration, script.scenes[2].durationSeconds),
        textOverlays: [
          { text: 'LIMITED FIRST EDITION', position: 'bottom', startSeconds: 0, endSeconds: script.scenes[2].durationSeconds },
        ],
        transition: 'fade',
      },
    ];

    return universalScenePlanSchema.parse({
      totalDurationSeconds: script.totalDurationSeconds,
      scenes,
    });
  }
}

