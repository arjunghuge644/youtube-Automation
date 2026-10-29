import React from 'react';
import { Audio, Series, staticFile } from 'remotion';
import { BlueprintBackground } from './components/BlueprintBackground';
import { HeaderBar } from './components/HeaderBar';
import { InterviewQuestionScene } from './components/InterviewQuestionScene';
import { DatabaseTransactionScene } from './components/DatabaseTransactionScene';
import { CacheLayerScene } from './components/CacheLayerScene';
import { SearchEngineScene } from './components/SearchEngineScene';
import { GeospatialMapScene } from './components/GeospatialMapScene';
import { SystemArchitectureScene } from './components/SystemArchitectureScene';
import { KineticTypographyScene } from './components/KineticTypographyScene';
import { SynchronizedCaptions } from './components/SynchronizedCaptions';
import type { TechnicalExplainerStoryboard, TechnicalExplainerScene } from '@creatorflow/shared';

export const SceneDispatcher: React.FC<{
  scene: TechnicalExplainerScene;
  width?: number;
  height?: number;
}> = ({ scene, width = 720, height = 1280 }) => {
  const renderSceneContent = () => {
    switch (scene.componentType) {
      case 'interview_question':
        return <InterviewQuestionScene props={scene.props as any} />;
      case 'database_transaction':
        return <DatabaseTransactionScene props={scene.props as any} />;
      case 'cache_layer':
        return <CacheLayerScene props={scene.props as any} />;
      case 'search_engine':
        return <SearchEngineScene props={scene.props as any} />;
      case 'geospatial_map':
        return <GeospatialMapScene props={scene.props as any} />;
      case 'system_architecture':
        return <SystemArchitectureScene props={scene.props as any} />;
      case 'kinetic_typography':
        return <KineticTypographyScene props={scene.props as any} />;
      default:
        return <KineticTypographyScene props={scene.props as any} />;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
      }}
    >
      {/* Background blueprint coordinate grid */}
      <BlueprintBackground width={width} height={height} />

      {/* Top Header Bar */}
      <HeaderBar header={scene.header} categoryTag={scene.componentType.replace('_', ' ').toUpperCase()} />

      {/* Main Specialized Component */}
      <div
        style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          boxSizing: 'border-box',
          paddingTop: '20px',
        }}
      >
        {renderSceneContent()}
      </div>

      {/* Captions */}
      <SynchronizedCaptions
        subtitles={scene.subtitles}
        fallbackText={scene.subtitles.length === 0 ? scene.narration : undefined}
      />

      {/* Audio narration if present */}
      {scene.narrationAudioUrl && (
        <Audio
          src={
            scene.narrationAudioUrl.startsWith('data:') ||
            scene.narrationAudioUrl.startsWith('http')
              ? scene.narrationAudioUrl
              : staticFile(scene.narrationAudioUrl)
          }
        />
      )}
    </div>
  );
};

export const TechnicalExplainerComposition: React.FC<TechnicalExplainerStoryboard> = (storyboard) => {
  const fps = storyboard.fps || 30;
  const width = storyboard.width || 720;
  const height = storyboard.height || 1280;

  return (
    <Series>
      {storyboard.scenes.map((scene) => {
        const durationInFrames =
          scene.durationInFrames && scene.durationInFrames > 0
            ? scene.durationInFrames
            : Math.max(30, Math.ceil(scene.durationSeconds * fps));

        return (
          <Series.Sequence key={scene.id} durationInFrames={durationInFrames}>
            <SceneDispatcher scene={scene} width={width} height={height} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
};
