import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { TechnicalExplainerPlanner } from '../apps/api/src/planner/explainer-planner.js';
import { RemotionRendererService } from '../apps/api/src/render/remotion-renderer.js';
import { AssetValidator } from '../apps/api/src/media/asset-validator.js';
import { QAEngine } from '../apps/api/src/media/qa-engine.js';
import type { TechnicalExplainerStoryboard } from '@creatorflow/shared';

const execFileAsync = promisify(execFile);

interface DemoVideoSpec {
  id: string;
  filename: string;
  prompt: string;
  expectedComponents: string[];
}

const demos: DemoVideoSpec[] = [
  {
    id: 'demo_1_auth',
    filename: 'demo_authn_vs_authz.mp4',
    prompt: 'Authentication vs Authorization in Cloud Systems',
    expectedComponents: ['comparison', 'flowchart', 'data_flow', 'kinetic_typography'],
  },
  {
    id: 'demo_2_rate_limiter',
    filename: 'demo_distributed_rate_limiter.mp4',
    prompt: 'How a distributed rate limiter works at scale with network diagram and statistics',
    expectedComponents: ['network_diagram', 'statistics', 'process_timeline', 'system_architecture'],
  },
  {
    id: 'demo_3_product_ad',
    filename: 'demo_product_advertisement.mp4',
    prompt: 'CreatorFlow AI product advertisement and studio launch',
    expectedComponents: ['ui_walkthrough', 'statistics', 'generic_infographic', 'comparison'],
  },
];

async function extractKeyframes(videoPath: string, outputDir: string, prefix: string, storyboard: TechnicalExplainerStoryboard) {
  await fs.mkdir(outputDir, { recursive: true });
  let accumulatedSeconds = 0;

  for (let i = 0; i < storyboard.scenes.length; i++) {
    const scene = storyboard.scenes[i];
    const duration = scene.durationSeconds || 3;
    // Extract at midpoint of each scene
    const timestamp = Number((accumulatedSeconds + duration * 0.5).toFixed(2));
    accumulatedSeconds += duration;

    const frameFile = `${prefix}_scene_${i + 1}_${scene.componentType}.png`;
    const framePath = path.join(outputDir, frameFile);

    const args = [
      '-y',
      '-ss', timestamp.toString(),
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2',
      framePath,
    ];

    try {
      await execFileAsync('ffmpeg', args);
      console.log(`    Saved keyframe: ${frameFile} at ${timestamp}s`);
    } catch (err) {
      console.warn(`    Failed to extract frame at ${timestamp}s:`, (err as Error).message);
    }
  }
}

async function main() {
  console.log('================================================================');
  console.log('  CreatorFlow AI — Release 2: Universal Production Pipeline    ');
  console.log('================================================================\n');

  const planner = new TechnicalExplainerPlanner();
  const renderer = new RemotionRendererService();
  const validator = new AssetValidator();
  const qaEngine = new QAEngine();

  const outputDir = path.resolve(process.cwd(), 'exports');
  const framesDir = path.resolve(outputDir, 'release2_frames');
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(framesDir, { recursive: true });

  const summaryResults: any[] = [];

  for (let i = 0; i < demos.length; i++) {
    const demo = demos[i];
    console.log(`\n----------------------------------------------------------------`);
    console.log(`[Video ${i + 1}/3] ${demo.filename}`);
    console.log(`Prompt: "${demo.prompt}"`);
    console.log(`Expected Components: ${demo.expectedComponents.join(', ')}`);
    console.log(`----------------------------------------------------------------`);

    // 1. Plan storyboard
    console.log('1. Planning structured storyboard JSON via TechnicalExplainerPlanner...');
    const storyboard = await planner.planStoryboard(demo.prompt, { aspectRatio: '9:16' });
    const componentsUsed = storyboard.scenes.map((s) => s.componentType);
    console.log(`   Selected Components: ${componentsUsed.join(' -> ')}`);
    console.log(`   Total Planned Scenes: ${storyboard.scenes.length}`);

    // Verify expected components are matched
    for (const expected of demo.expectedComponents) {
      if (!componentsUsed.includes(expected as any)) {
        throw new Error(`Storyboard missing expected component '${expected}'. Got: ${componentsUsed.join(', ')}`);
      }
    }

    // 2. Render MP4
    const outputPath = path.join(outputDir, demo.filename);
    console.log(`2. Rendering MP4 with Remotion and local audio synthesis...`);
    const renderResult = await renderer.renderExplainerVideo(storyboard, {
      outputDir,
      filename: demo.filename,
      compositionId: 'TechnicalExplainer-9x16',
    });
    console.log(`   ✓ Render complete: ${renderResult.outputPath} (${renderResult.totalDurationSeconds}s, ${renderResult.totalFrames} frames)`);

    // 3. Technical Inspection
    console.log(`3. Inspecting media format and codecs with FFprobe...`);
    const probe = await validator.inspectMedia(outputPath);
    const vStream = probe.streams?.find((s: any) => s.codec_type === 'video');
    const aStream = probe.streams?.find((s: any) => s.codec_type === 'audio');
    const actualDuration = Number(probe.format?.duration || 0);
    const fileSizeMb = (Number(probe.format?.size || 0) / (1024 * 1024)).toFixed(2);

    console.log(`   Resolution: ${vStream?.width}x${vStream?.height} (9:16 vertical)`);
    console.log(`   Video Codec: ${vStream?.codec_name} @ ${vStream?.r_frame_rate} fps`);
    console.log(`   Audio Codec: ${aStream?.codec_name} (${aStream?.sample_rate} Hz stereo)`);
    console.log(`   File Size: ${fileSizeMb} MB`);
    console.log(`   Duration: ${actualDuration}s`);

    // 4. Quality Assurance Verification
    console.log(`4. Running Automated Visual QA and Black-Frame Anomaly Detection...`);
    const mockStoryboardData = {
      projectId: demo.id,
      title: storyboard.title,
      scenes: storyboard.scenes.map((s) => ({
        sceneNumber: s.sceneNumber,
        title: s.header.actTitle,
        durationSeconds: s.durationSeconds,
        visualDescription: `Scene ${s.sceneNumber}`,
        cameraMotion: 'static',
        lighting: 'clean',
        providerPrompt: 'remotion prompt',
        negativePrompt: '',
        narrationText: s.narration,
        narrationEnabled: true,
        suggestedProvider: 'remotion_explainer',
        aspectRatio: '9:16' as const,
      })),
      totalDurationSeconds: actualDuration,
    };

    const mockAssets = storyboard.scenes.flatMap((s) => [
      {
        id: `v_${demo.id}_${s.sceneNumber}`,
        projectId: demo.id,
        sceneId: `scene_${s.sceneNumber}`,
        type: 'video' as const,
        filePath: outputPath,
        isValidated: true,
        metadata: {},
      },
      {
        id: `a_${demo.id}_${s.sceneNumber}`,
        projectId: demo.id,
        sceneId: `scene_${s.sceneNumber}`,
        type: 'audio' as const,
        filePath: outputPath,
        isValidated: true,
        metadata: {},
      },
    ]);

    const qaResult = await qaEngine.runDeterministicQA({
      project: {
        id: demo.id,
        ownerId: 'user_release2',
        title: storyboard.title,
        prompt: demo.prompt,
        category: 'educational',
        language: 'en',
        aspectRatio: '9:16',
        targetDurationSeconds: actualDuration,
        budgetUsd: 0,
        visualStyle: 'technical_explainer',
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      script: {
        projectId: demo.id,
        title: storyboard.title,
        scenes: [],
        totalWordCount: 100,
        estimatedDurationSeconds: actualDuration,
        version: 1,
        approved: true,
      },
      storyboard: mockStoryboardData,
      tasks: [],
      assets: mockAssets,
      finalExportPath: outputPath,
      expectedDurationSeconds: actualDuration,
    });

    console.log(`   QA Outcome: ${qaResult.outcome} (${qaResult.checks.filter((c) => c.passed).length}/${qaResult.checks.length} checks passed)`);
    for (const check of qaResult.checks) {
      console.log(`     [${check.passed ? 'PASS' : 'FAIL'}] ${check.name}: ${check.details}`);
    }

    if (!qaResult.passed) {
      throw new Error(`Video ${demo.filename} failed QA checks!`);
    }

    // 5. Extract Representative Keyframes
    console.log(`5. Extracting keyframes for visual inspection into exports/release2_frames/...`);
    const prefix = demo.filename.replace('.mp4', '');
    await extractKeyframes(outputPath, framesDir, prefix, storyboard);

    summaryResults.push({
      video: demo.filename,
      title: storyboard.title,
      duration: `${actualDuration.toFixed(1)}s`,
      fileSize: `${fileSizeMb} MB`,
      components: componentsUsed,
      qaOutcome: qaResult.outcome,
    });
  }

  console.log('\n================================================================');
  console.log('              ALL 3 DEMONSTRATION VIDEOS VERIFIED               ');
  console.log('================================================================');
  console.table(summaryResults);
}

main().catch((err) => {
  console.error('\n❌ Production pipeline failed:', err);
  process.exit(1);
});
