import type { StoryboardData, Asset, TimelineManifest, TimelineSceneSync } from '@creatorflow/shared';

export interface SceneDurationInfo {
  sceneNumber: number;
  videoAsset: Asset;
  videoDuration: number;
  audioAsset?: Asset;
  audioDuration: number;
}

export interface SyncOptions {
  speedAdjustmentMin?: number; // default 0.85
  speedAdjustmentMax?: number; // default 1.15
  silencePaddingSeconds?: number; // default 0.3
}

export class TimelineSynchronizer {
  /**
   * Plan scene-by-scene timing and compute adjustments needed between video & narration.
   */
  synchronizeTimeline(
    storyboard: StoryboardData,
    videoAssets: Asset[],
    audioAssets: Asset[] = [],
    options: SyncOptions = {},
  ): TimelineManifest {
    const {
      speedAdjustmentMin = 0.85,
      speedAdjustmentMax = 1.15,
      silencePaddingSeconds = 0.3,
    } = options;

    const scenes: TimelineSceneSync[] = [];
    let totalTimelineSeconds = 0;

    for (const scene of storyboard.scenes) {
      const sceneNum = scene.sceneNumber;
      const videoAsset = videoAssets.find((a) => a.sceneId === `scene_${sceneNum}`);
      if (!videoAsset) {
        throw new Error(`Cannot synchronize timeline: Missing video asset for scene ${sceneNum}`);
      }

      const audioAsset = audioAssets.find((a) => a.sceneId === `scene_${sceneNum}`);
      const videoDuration = videoAsset.durationSeconds || scene.durationSeconds;
      const audioDuration = audioAsset?.durationSeconds || (scene.narrationEnabled ? 0 : 0);

      let videoAdjustment: TimelineSceneSync['videoAdjustment'] = 'none';
      let speedFactor = 1.0;
      let finalDuration = videoDuration;

      // When narration exists for this scene
      if (audioDuration > 0) {
        const targetAudioWithPadding = audioDuration + silencePaddingSeconds;
        const ratio = targetAudioWithPadding / videoDuration;

        if (Math.abs(videoDuration - targetAudioWithPadding) <= 0.3) {
          // Durations are essentially aligned
          videoAdjustment = 'none';
          finalDuration = Number(Math.max(videoDuration, targetAudioWithPadding).toFixed(2));
        } else if (videoDuration > targetAudioWithPadding) {
          // Video is longer than narration: trim video to narration + pause
          videoAdjustment = 'trim';
          finalDuration = Number(targetAudioWithPadding.toFixed(2));
        } else {
          // Video is shorter than narration
          if (ratio <= speedAdjustmentMax) {
            // Slight video slow-down within acceptable bounded range (e.g. 0.85x - 0.95x speed)
            videoAdjustment = 'slow_down';
            speedFactor = Number((1 / ratio).toFixed(2));
            finalDuration = Number(targetAudioWithPadding.toFixed(2));
          } else {
            // Video is significantly shorter: hold last frame at the end
            videoAdjustment = 'hold_frame';
            finalDuration = Number(targetAudioWithPadding.toFixed(2));
          }
        }
      } else {
        // No narration: video plays for its natural duration
        videoAdjustment = 'none';
        finalDuration = videoDuration;
      }

      scenes.push({
        sceneNumber: sceneNum,
        videoAssetId: videoAsset.id,
        videoOriginalDuration: videoDuration,
        audioAssetId: audioAsset?.id,
        audioDuration,
        videoAdjustment,
        speedFactor,
        finalDuration,
      });

      totalTimelineSeconds += finalDuration;
    }

    return {
      projectId: storyboard.projectId,
      aspectRatio: storyboard.scenes[0]?.aspectRatio || '9:16',
      totalDuration: Number(totalTimelineSeconds.toFixed(2)),
      scenes,
      createdAt: new Date().toISOString(),
    };
  }
}

