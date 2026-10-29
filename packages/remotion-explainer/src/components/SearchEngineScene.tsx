import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SearchEngineProps } from '@creatorflow/shared';

export const SearchEngineScene: React.FC<{ props: SearchEngineProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Search input typing simulation
  const textLength = props.searchQuery.length;
  const charsShown = Math.min(
    textLength,
    Math.floor(interpolate(frame, [10, 32], [0, textLength], { extrapolateRight: 'clamp' }))
  );
  const currentText = props.searchQuery.slice(0, charsShown);
  const cursorBlink = Math.floor(frame / (fps / 2)) % 2 === 0;

  // Typo indicator appears after full word is typed
  const typoRevealed = frame > 36 && props.hasTypo;
  const typoEntrance = spring({
    frame: frame - 36,
    fps,
    config: theme.springs.bouncy,
  });

  // Engine card entrance
  const engineEntrance = spring({
    frame: frame - 42,
    fps,
    config: theme.springs.snappy,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 48px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '32px',
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${typoRevealed ? theme.colors.accentCoral : theme.colors.cardBorder}`,
          borderRadius: '50px',
          padding: '24px 36px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: typoRevealed
            ? `0 0 24px ${theme.colors.accentCoralGlow}`
            : '0 12px 30px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '32px', opacity: 0.8 }}>🔍</span>
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '38px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
              position: 'relative',
              display: 'inline-block',
            }}
          >
            {currentText}
            <span
              style={{
                color: theme.colors.accentYellow,
                opacity: cursorBlink ? 1 : 0,
              }}
            >
              |
            </span>

            {/* Red wavy squiggly underline under typo */}
            {typoRevealed && (
              <svg
                width="100%"
                height="8"
                style={{
                  position: 'absolute',
                  left: 0,
                  bottom: -8,
                  overflow: 'visible',
                }}
              >
                <path
                  d={`M 0,4 Q 6,0 12,4 T 24,4 T 36,4 T 48,4 T 60,4 T 72,4 T 84,4 T 96,4 T 108,4 T 120,4`}
                  fill="none"
                  stroke={theme.colors.accentCoral}
                  strokeWidth="2.5"
                />
              </svg>
            )}
          </div>
        </div>

        {/* TYPO Tag Badge */}
        {typoRevealed && (
          <div
            style={{
              backgroundColor: 'rgba(255, 92, 92, 0.15)',
              border: `1.5px solid ${theme.colors.accentCoral}`,
              borderRadius: '8px',
              padding: '6px 16px',
              fontFamily: theme.fonts.mono,
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: theme.colors.accentCoral,
              transform: `scale(${typoEntrance})`,
              boxShadow: `0 0 12px ${theme.colors.accentCoralGlow}`,
            }}
          >
            {props.typoLabel}
          </div>
        )}
      </div>

      {/* Engine Card (Elasticsearch / Inverted Index) */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.accentYellow}`,
          borderRadius: '24px',
          padding: '36px 36px',
          boxSizing: 'border-box',
          opacity: engineEntrance,
          transform: `scale(${interpolate(engineEntrance, [0, 1], [0.94, 1])}) translateY(${interpolate(
            engineEntrance,
            [0, 1],
            [20, 0]
          )}px)`,
          boxShadow: `0 0 28px ${theme.colors.accentYellowGlow}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
          <span style={{ fontSize: '28px', color: theme.colors.accentYellow }}>🔍</span>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: theme.colors.accentYellow,
            }}
          >
            {props.engine.name}
          </div>
        </div>

        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '18px',
            color: theme.colors.textMuted,
            letterSpacing: '1px',
            marginBottom: '28px',
          }}
        >
          {props.engine.technology}
        </div>

        {/* Fuzzy Tokens Breakdown */}
        {props.engine.tokens && props.engine.tokens.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '13px',
                letterSpacing: '2px',
                color: theme.colors.textSubtle,
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              N-Gram Inverted Index & Token Matching
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {props.engine.tokens.map((token, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: theme.colors.cardBgSolid,
                    border: `1px solid ${theme.colors.cardBorder}`,
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontFamily: theme.fonts.mono,
                    fontSize: '16px',
                    color: theme.colors.accentCyan,
                  }}
                >
                  "{token}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fuzzy Match Result */}
        {props.engine.fuzzyMatch && (
          <div
            style={{
              marginTop: '24px',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: `1.5px solid ${theme.colors.accentEmerald}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: theme.fonts.sans,
            }}
          >
            <div style={{ fontSize: '18px', color: theme.colors.textPrimary, fontWeight: 600 }}>
              Corrected Match:
            </div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: theme.colors.accentEmerald,
              }}
            >
              {props.engine.fuzzyMatch} ✓
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
