import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { GenericInfographicProps } from '@creatorflow/shared';

export const GenericInfographicScene: React.FC<{ props: GenericInfographicProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const calloutEntrance = spring({
    frame: frame - 40,
    fps,
    config: theme.springs.gentle,
  });

  const defaultAccents = [
    theme.colors.accentCyan,
    theme.colors.accentEmerald,
    theme.colors.accentYellow,
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
        gap: '20px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          opacity: titleEntrance,
          transform: `translateY(${interpolate(titleEntrance, [0, 1], [-15, 0])}px)`,
        }}
      >
        {props.header.badge && (
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '2.5px',
              color: theme.colors.accentYellow,
              textTransform: 'uppercase',
            }}
          >
            {props.header.badge}
          </span>
        )}
        <span
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '26px',
            fontWeight: 800,
            color: theme.colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {props.header.title}
        </span>
        {props.header.subtitle && (
          <span style={{ fontFamily: theme.fonts.mono, fontSize: '12px', color: theme.colors.textMuted }}>
            {props.header.subtitle}
          </span>
        )}
      </div>

      {/* Infographic Sections Stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          maxWidth: '560px',
        }}
      >
        {props.sections.map((section, idx) => {
          const sectionEntrance = spring({
            frame: frame - (idx * 10 + 10),
            fps,
            config: theme.springs.snappy,
          });

          const accent = section.accentColor || defaultAccents[idx % defaultAccents.length];

          return (
            <div
              key={idx}
              style={{
                background: theme.colors.cardBgSolid,
                border: `1.5px solid ${theme.colors.cardBorder}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                opacity: sectionEntrance,
                transform: `translateX(${interpolate(sectionEntrance, [0, 1], [-20, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: theme.fonts.sans, fontSize: '17px', fontWeight: 800, color: theme.colors.textPrimary }}>
                  {section.title}
                </span>
                {section.badge && (
                  <span
                    style={{
                      fontFamily: theme.fonts.mono,
                      fontSize: '11px',
                      color: accent,
                      background: `${accent}18`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${accent}44`,
                    }}
                  >
                    {section.badge}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: theme.fonts.sans, fontSize: '13px', color: theme.colors.textSecondary, lineHeight: 1.4 }}>
                {section.body}
              </span>
            </div>
          );
        })}
      </div>

      {/* Callout Quote */}
      {props.callout && (
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(255, 209, 102, 0.08)',
            border: `1.5px solid ${theme.colors.accentYellow}`,
            borderRadius: '12px',
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            opacity: calloutEntrance,
            transform: `translateY(${interpolate(calloutEntrance, [0, 1], [15, 0])}px)`,
          }}
        >
          <span style={{ fontFamily: theme.fonts.sans, fontSize: '14px', fontStyle: 'italic', color: theme.colors.accentYellow, lineHeight: 1.4 }}>
            "{props.callout.quote}"
          </span>
          {props.callout.authorOrSource && (
            <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted, textAlign: 'right' }}>
              — {props.callout.authorOrSource}
            </span>
          )}
        </div>
      )}

      {/* Footer Tag */}
      {props.footerTag && (
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '11px',
            color: theme.colors.textSubtle,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {props.footerTag}
        </span>
      )}
    </div>
  );
};

