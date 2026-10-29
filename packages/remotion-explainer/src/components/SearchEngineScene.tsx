import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SearchEngineProps } from '@creatorflow/shared';

export const SearchEngineScene: React.FC<{ props: SearchEngineProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Progress-based milestone timing
  const typingEndFrame = Math.round(durationInFrames * 0.28);
  const typoFrame = Math.round(durationInFrames * 0.36);
  const engineFrame = Math.round(durationInFrames * 0.50);
  const fuzzyResultFrame = Math.round(durationInFrames * 0.65);

  // Search input typing simulation
  const textLength = props.searchQuery.length;
  const charsShown = Math.min(
    textLength,
    Math.floor(interpolate(frame, [8, typingEndFrame], [0, textLength], { extrapolateRight: 'clamp' }))
  );
  const currentText = props.searchQuery.slice(0, charsShown);
  const cursorBlink = Math.floor(frame / (fps / 2)) % 2 === 0;

  // Typo indicator appears after full word is typed
  const typoRevealed = frame >= typoFrame && props.hasTypo;
  const typoEntrance = spring({
    frame: frame - typoFrame,
    fps,
    config: theme.springs.bouncy,
  });

  // Engine card entrance
  const engineEntrance = spring({
    frame: frame - engineFrame,
    fps,
    config: theme.springs.snappy,
  });

  // Fuzzy result drop
  const resultEntrance = spring({
    frame: frame - fuzzyResultFrame,
    fps,
    config: theme.springs.bouncy,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px',
        width: '100%',
        maxWidth: '640px',
        boxSizing: 'border-box',
        gap: '24px',
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBgSolid,
          border: `2px solid ${typoRevealed ? theme.colors.accentCoral : theme.colors.cardBorder}`,
          borderRadius: '50px',
          padding: '24px 34px',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: typoRevealed
            ? `0 0 28px ${theme.colors.accentCoralGlow}`
            : '0 12px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span style={{ fontSize: '32px' }}>🔍</span>
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '40px',
              fontWeight: 800,
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
                  strokeWidth="3"
                />
              </svg>
            )}
          </div>
        </div>

        {/* TYPO Tag Badge */}
        {typoRevealed && (
          <div
            style={{
              backgroundColor: 'rgba(255, 92, 92, 0.2)',
              border: `2px solid ${theme.colors.accentCoral}`,
              borderRadius: '10px',
              padding: '8px 18px',
              fontFamily: theme.fonts.mono,
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '2px',
              color: theme.colors.accentCoral,
              transform: `scale(${typoEntrance})`,
              boxShadow: `0 0 16px ${theme.colors.accentCoralGlow}`,
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
          backgroundColor: theme.colors.cardBgSolid,
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
          boxShadow: `0 0 32px ${theme.colors.accentYellowGlow}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '32px', color: theme.colors.accentYellow }}>⚡</span>
            <div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: theme.colors.accentYellow,
                }}
              >
                {props.engine.name}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '16px',
                  color: theme.colors.textMuted,
                  letterSpacing: '1px',
                }}
              >
                {props.engine.technology} · Inverted Index
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${theme.colors.accentCyan}`,
              fontFamily: theme.fonts.mono,
              fontSize: '13px',
              fontWeight: 800,
              color: theme.colors.accentCyan,
            }}
          >
            FUZZY MATCH
          </div>
        </div>

        {/* Fuzzy Tokens Breakdown */}
        {props.engine.tokens && props.engine.tokens.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '15px',
                letterSpacing: '2px',
                color: theme.colors.textMuted,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              N-Gram Inverted Index & Token Matching
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {props.engine.tokens.map((token, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    border: `1.5px solid ${theme.colors.accentCyan}`,
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontFamily: theme.fonts.mono,
                    fontSize: '18px',
                    fontWeight: 800,
                    color: theme.colors.accentCyan,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  "{token}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Autocomplete Corrected Match Dropdown */}
        {props.engine.fuzzyMatch && frame >= fuzzyResultFrame && (
          <div
            style={{
              padding: '20px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: `2px solid ${theme.colors.accentEmerald}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: theme.fonts.sans,
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
              transform: `scale(${interpolate(resultEntrance, [0, 1], [0.92, 1])})`,
            }}
          >
            <div>
              <div style={{ fontSize: '15px', fontFamily: theme.fonts.mono, color: theme.colors.textMuted, textTransform: 'uppercase' }}>
                DID YOU MEAN?
              </div>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  color: '#FFFFFF',
                }}
              >
                {props.engine.fuzzyMatch}
              </div>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: theme.colors.accentEmerald,
                color: '#080F22',
                fontFamily: theme.fonts.mono,
                fontWeight: 900,
                fontSize: '14px',
                letterSpacing: '1px',
              }}
            >
              DISTANCE: 1 ✓
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
