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

  // Determine active subtitle with gap-filling continuity
  let activeText: string | undefined;

  if (subtitles && subtitles.length > 0) {
    // 1. Direct match
    const directMatch = subtitles.find(
      (s) => currentSeconds >= s.startSeconds && currentSeconds <= s.endSeconds
    );

    if (directMatch) {
      activeText = directMatch.text;
    } else {
      // 2. Continuity hold: if between subtitles or just after last subtitle, hold previous subtitle
      const previousSub = [...subtitles].reverse().find((s) => currentSeconds >= s.startSeconds);
      if (previousSub && currentSeconds <= previousSub.endSeconds + 0.6) {
        activeText = previousSub.text;
      }
    }
  }

  const displayText = activeText || fallbackText;
  if (!displayText) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '60px',
        left: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 32px',
        boxSizing: 'border-box',
        zIndex: 30,
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(7, 14, 32, 0.94)',
          border: `2px solid rgba(255, 209, 102, 0.4)`,
          borderRadius: '16px',
          padding: '16px 28px',
          maxWidth: '92%',
          textAlign: 'center',
          boxShadow: '0 10px 35px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 209, 102, 0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '28px',
            fontWeight: 800,
            lineHeight: 1.35,
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
