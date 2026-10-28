import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Project } from '@creatorflow/shared';
import { CreativeDirector } from '../apps/api/src/planner/creative-director.js';
import { TimelinePipeline } from '../apps/api/src/render/timeline-pipeline.js';

async function main() {
  const exportsDir = path.resolve(process.cwd(), 'exports');
  await fs.mkdir(exportsDir, { recursive: true });

  const creativeDirector = new CreativeDirector();
  const pipeline = new TimelinePipeline();

  console.log('====================================================');
  console.log('🎥 CREATORFLOW AI — MULTI-CATEGORY DEMO VIDEO EXPORT');
  console.log('====================================================\n');

  // Test A: Educational Hindi Animation (Procedural 3D)
  const testAProject: Project = {
    id: 'proj_demo_test_a',
    ownerId: 'demo_user',
    title: 'ट्रैफिक जाम क्यों होता है?',
    prompt: 'एक 3D एनिमेटेड व्याख्या जो समझाती है कि बिना किसी दुर्घटना के भी अचानक लंबा ट्रैफिक जाम कैसे लग जाता है।',
    category: 'educational',
    language: 'hi',
    durationSeconds: 16, // 4 scenes x 4s
    aspectRatio: '9:16', // Vertical Shorts/Reels
    visualStyle: 'stylized_3d',
    narrationStyle: 'documentary',
    narrationEnabled: true,
    audience: 'General audience',
    resolution: '720p',
    status: 'READY_TO_RENDER',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('📌 [Test A] Generating Production Plan for Hindi 3D Animation...');
  const scriptA = await creativeDirector.generateScript(testAProject);
  const planA = await creativeDirector.generateScenePlan(testAProject, scriptA);
  const outA = path.join(exportsDir, 'demo_educational_traffic_3d.mp4');
  console.log(`🎬 [Test A] Rendering 9:16 video to ${outA}...`);
  await pipeline.renderVideo(testAProject, planA, { outputPath: outA });

  // Test B: Nature Documentary (Media Composition & Lower Thirds)
  const testBProject: Project = {
    id: 'proj_demo_test_b',
    ownerId: 'demo_user',
    title: 'Wonders of the Living Ocean',
    prompt: 'A cinematic ocean documentary exploring coral reef sanctuaries and marine symbiosis with narration.',
    category: 'documentary',
    language: 'en',
    durationSeconds: 12, // 3 scenes x 4s
    aspectRatio: '16:9', // Landscape YouTube
    visualStyle: 'documentary_footage',
    narrationStyle: 'documentary',
    narrationEnabled: true,
    audience: 'Nature enthusiasts',
    resolution: '720p',
    status: 'READY_TO_RENDER',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('\n📌 [Test B] Generating Production Plan for Nature Documentary...');
  const scriptB = await creativeDirector.generateScript(testBProject);
  const planB = await creativeDirector.generateScenePlan(testBProject, scriptB);
  const outB = path.join(exportsDir, 'demo_documentary_ocean.mp4');
  console.log(`🎬 [Test B] Rendering 16:9 video to ${outB}...`);
  await pipeline.renderVideo(testBProject, planB, { outputPath: outB });

  // Test C: Product Promotion (Kinetic Typography & Motion Graphics)
  const testCProject: Project = {
    id: 'proj_demo_test_c',
    ownerId: 'demo_user',
    title: 'NextGen Sound Commercial',
    prompt: 'A high-energy product launch commercial for premium headphones with kinetic typography and product cards.',
    category: 'product_promo',
    language: 'en',
    durationSeconds: 12, // 3 scenes x 4s
    aspectRatio: '1:1', // Square Instagram feed
    visualStyle: 'motion_graphics',
    narrationStyle: 'energetic',
    narrationEnabled: false, // Music and visual led
    audience: 'Audio enthusiasts and creators',
    resolution: '720p',
    status: 'READY_TO_RENDER',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log('\n📌 [Test C] Generating Production Plan for Product Promo (1:1 Square)...');
  const scriptC = await creativeDirector.generateScript(testCProject);
  const planC = await creativeDirector.generateScenePlan(testCProject, scriptC);
  const outC = path.join(exportsDir, 'demo_product_promo.mp4');
  console.log(`🎬 [Test C] Rendering 1:1 square video to ${outC}...`);
  await pipeline.renderVideo(testCProject, planC, { outputPath: outC });

  console.log('\n====================================================');
  console.log('🎉 ALL DEMO VIDEOS GENERATED SUCCESSFULLY:');
  console.log(`1. Test A: ${outA}`);
  console.log(`2. Test B: ${outB}`);
  console.log(`3. Test C: ${outC}`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('❌ Demo generation error:', err);
  process.exit(1);
});

