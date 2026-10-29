import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { ConceptBreakdownProps } from '@creatorflow/shared';

export const ConceptBreakdownScene: React.FC<{ props: ConceptBreakdownProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const takeawayEntrance = spring({
    frame: frame - 45,
    fps,
    config: theme.springs.gentle,
  });

  const defaultColors = [
    theme.colors.accentCyan,
    theme.colors.accentYellow,
    theme.colors.accentEmerald,
    '#A78BFA',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 32px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '22px',
      }}
    >
      {/* Central Concept Tag */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          opacity: titleEntrance,
          transform: `translateY(${interpolate(titleEntrance, [0, 1], [-15, 0])}px)`,
        }}
      >
        {props.coreConcept.category && (
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '2.5px',
              color: theme.colors.accentYellow,
              textTransform: 'uppercase',
            }}
          >
            {props.coreConcept.category}
          </span>
        )}
        <span
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '28px',
            fontWeight: 900,
            color: theme.colors.textPrimary,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}
        >
          {props.coreConcept.title}
        </span>
      </div>

      {/* Pillars Grid / Stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '560px',
        }}
      >
        {props.pillars.map((pillar, idx) => {
          const pillarEntrance = spring({
            frame: frame - (idx * 10 + 10),
            fps,
            config: theme.springs.snappy,
          });

          const color = pillar.accentColor || defaultColors[idx % defaultColors.length];

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                background: theme.colors.cardBgSolid,
                border: `1.5px solid ${theme.colors.cardBorder}`,
                borderLeft: `4px solid ${color}`,
                borderRadius: '12px',
                padding: '14px 18px',
                boxShadow: `0 4px 20px rgba(0, 0, 0, 0.4)`,
                opacity: pillarEntrance,
                transform: `translateX(${interpolate(pillarEntrance, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: `${color}22`,
                  border: `1px solid ${color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: theme.fonts.mono,
                  fontSize: '14px',
                  fontWeight: 900,
                  color,
                  flexShrink: 0,
                }}
              >
                0{idx + 1}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '18px',
                      fontWeight: 800,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {pillar.title}
                  </span>
                  {pillar.tag && (
                    <span
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: '11px',
                        color,
                        background: `${color}15`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${color}44`,
                      }}
                    >
                      {pillar.tag}
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontFamily: theme.fonts.sans,
                    fontSize: '13px',
                    color: theme.colors.textSecondary,
                    lineHeight: 1.4,
                  }}
                >
                  {pillar.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Takeaway banner */}
      {props.takeaway && (
        <div
          style={{
            marginTop: '6px',
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(56, 189, 248, 0.1)',
            border: `1.5px solid ${theme.colors.accentCyan}`,
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            opacity: takeawayEntrance,
            transform: `translateY(${interpolate(takeawayEntrance, [0, 1], [15, 0])}px)`,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '12px',
              fontWeight: 800,
              color: theme.colors.accentCyan,
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            KEY TAKEAWAY:
          </span>
          <span
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '15px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
              lineHeight: 1.35,
            }}
          >
            {props.takeaway.headline}
          </span>
        </div>
      )}
    </div>
  );
};
