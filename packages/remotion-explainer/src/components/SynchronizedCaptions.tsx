import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SubtitleItem } from '@creatorflow/shared';

interface SynchronizedCaptionsProps {
  subtitles: SubtitleItem[];
  fallbackText?: string;
}

export const SynchronizedCaptions: React.FC<SynchronizedCaptionsProps> = ({
  subtitles,
  fallbackText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSeconds = frame / fps;

  // Find active subtitle item
  const activeSub = subtitles.find(
    (s) => currentSeconds >= s.startSeconds && currentSeconds <= s.endSeconds
  );

  const displayText = activeSub ? activeSub.text : fallbackText;
  if (!displayText) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 40px',
        boxSizing: 'border-box',
        zIndex: 20,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(7, 14, 32, 0.88)',
          border: `1.5px solid ${theme.colors.cardBorder}`,
          borderRadius: '16px',
          padding: '16px 28px',
          maxWidth: '90%',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '26px',
            fontWeight: 800,
            lineHeight: 1.3,
            color: theme.colors.textPrimary,
            letterSpacing: '0.2px',
          }}
        >
          {displayText}
        </span>
      </div>
    </div>
  );
};
