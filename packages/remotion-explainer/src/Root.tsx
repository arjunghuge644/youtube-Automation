import React from 'react';
import { Composition } from 'remotion';
import { TechnicalExplainerComposition } from './TechnicalExplainerComposition';
import { sampleExplainerStoryboard } from './sample-data';
import type { TechnicalExplainerStoryboard } from '@creatorflow/shared';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TechnicalExplainer-9x16"
        component={TechnicalExplainerComposition}
        durationInFrames={sampleExplainerStoryboard.totalDurationInFrames || 630}
        fps={30}
        width={720}
        height={1280}
        defaultProps={sampleExplainerStoryboard}
        calculateMetadata={({ props }: { props: TechnicalExplainerStoryboard }) => {
          const fps = props.fps || 30;
          // Sum up exact scene durations if totalDurationInFrames not set
          const totalFrames =
            props.totalDurationInFrames ||
            props.scenes?.reduce(
              (acc, s) => acc + (s.durationInFrames || Math.ceil(s.durationSeconds * fps)),
              0
            ) ||
            630;

          return {
            durationInFrames: Math.max(90, totalFrames),
            fps,
            width: props.width || 720,
            height: props.height || 1280,
          };
        }}
      />
      <Composition
        id="TechnicalExplainer-16x9"
        component={TechnicalExplainerComposition}
        durationInFrames={sampleExplainerStoryboard.totalDurationInFrames || 630}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          ...sampleExplainerStoryboard,
          aspectRatio: '16:9',
          width: 1920,
          height: 1080,
        }}
        calculateMetadata={({ props }: { props: TechnicalExplainerStoryboard }) => {
          const fps = props.fps || 30;
          const totalFrames =
            props.totalDurationInFrames ||
            props.scenes?.reduce(
              (acc, s) => acc + (s.durationInFrames || Math.ceil(s.durationSeconds * fps)),
              0
            ) ||
            630;

          return {
            durationInFrames: Math.max(90, totalFrames),
            fps,
            width: props.width || 1920,
            height: props.height || 1080,
          };
        }}
      />
    </>
  );
};
