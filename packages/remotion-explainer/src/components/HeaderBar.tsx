import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { ExplainerHeader } from '@creatorflow/shared';

interface HeaderBarProps {
  header: ExplainerHeader;
  categoryTag?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  header,
  categoryTag = 'TECHNICAL EXPLAINER',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: theme.springs.gentle,
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const translateY = interpolate(entrance, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        width: '100%',
        padding: '52px 48px 24px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: theme.fonts.mono,
        boxSizing: 'border-box',
        zIndex: 10,
      }}
    >
      {/* Top Metadata Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '17px',
          letterSpacing: '2.5px',
          color: theme.colors.textMuted,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        <div>{header.topicTag}</div>
        <div style={{ color: theme.colors.textSubtle }}>{header.channelHandle}</div>
      </div>

      {/* Act / Scene Step Tracker */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '2px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: theme.colors.accentYellow, fontWeight: 900 }}>—</span>
          <span style={{ color: theme.colors.accentYellow }}>
            {header.actNumber} / {header.actTitle}
          </span>
        </div>
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '1.5px',
            color: theme.colors.textSubtle,
            fontWeight: 500,
          }}
        >
          {categoryTag}
        </div>
      </div>
    </div>
  );
};
