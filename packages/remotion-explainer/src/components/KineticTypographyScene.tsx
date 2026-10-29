import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { KineticTypographyProps } from '@creatorflow/shared';

export const KineticTypographyScene: React.FC<{ props: KineticTypographyProps }> = ({
  props,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Dynamic milestones scaled to narration duration
  const headingStart = Math.max(3, Math.floor(durationInFrames * 0.05));
  const badgesStart = Math.floor(durationInFrames * 0.12);
  const cardStart = Math.floor(durationInFrames * 0.38);
  const punchlineStart = Math.floor(durationInFrames * 0.60);

  // Heading spring
  const headingEntrance = spring({
    frame: frame - headingStart,
    fps,
    config: theme.springs.snappy,
  });

  // Punchline spring
  const punchlineEntrance = spring({
    frame: frame - punchlineStart,
    fps,
    config: theme.springs.bouncy,
  });

  // Card spring
  const cardEntrance = spring({
    frame: frame - cardStart,
    fps,
    config: theme.springs.snappy,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 40px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '28px',
        textAlign: 'center',
      }}
    >
      {/* Heading */}
      {props.heading && (
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '44px',
            fontWeight: 800,
            color: theme.colors.textPrimary,
            lineHeight: 1.25,
            opacity: headingEntrance,
            transform: `translateY(${interpolate(headingEntrance, [0, 1], [15, 0])}px)`,
          }}
        >
          {props.heading}
        </div>
      )}

      {/* Badges / Checklist Items */}
      {props.badges && props.badges.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {props.badges.map((b, idx) => {
            const badgeFrame = badgesStart + idx * 14;
            const badgeEntrance = spring({
              frame: frame - badgeFrame,
              fps,
              config: theme.springs.snappy,
            });

            const isSuccess = b.status === 'success';
            const iconColor = isSuccess ? theme.colors.accentEmerald : theme.colors.accentCoral;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  fontFamily: theme.fonts.sans,
                  fontSize: '36px',
                  fontWeight: 800,
                  color: isSuccess ? theme.colors.textPrimary : theme.colors.accentCoral,
                  opacity: badgeEntrance,
                  transform: `translateX(${interpolate(badgeEntrance, [0, 1], [-24, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: `2.5px solid ${iconColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: iconColor,
                    boxShadow: `0 0 14px ${iconColor}66`,
                    flexShrink: 0,
                  }}
                >
                  {isSuccess ? '✓' : '✕'}
                </div>
                <span>{b.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Central Content Card if specified */}
      {props.card && (
        <div
          style={{
            width: '90%',
            backgroundColor: theme.colors.cardBg,
            border: `2px solid ${theme.colors.cardBorder}`,
            borderRadius: '24px',
            padding: '38px 32px',
            boxSizing: 'border-box',
            opacity: cardEntrance,
            transform: `scale(${interpolate(cardEntrance, [0, 1], [0.92, 1])})`,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '15px',
              letterSpacing: '2px',
              color: theme.colors.textMuted,
              marginBottom: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {props.card.tag}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '48px',
              fontWeight: 800,
              color: theme.colors.textPrimary,
              marginBottom: '10px',
              letterSpacing: '1px',
            }}
          >
            {props.card.title}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '20px',
              color: theme.colors.accentYellow,
              fontWeight: 600,
            }}
          >
            {props.card.subtitle}
          </div>
        </div>
      )}

      {/* Big Impact Punchline */}
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: '50px',
          fontWeight: 800,
          lineHeight: 1.25,
          color: theme.colors.textPrimary,
          opacity: punchlineEntrance,
          transform: `scale(${interpolate(punchlineEntrance, [0, 1], [0.92, 1])})`,
          textShadow: '0 4px 24px rgba(0, 0, 0, 0.6)',
          marginTop: '16px',
        }}
      >
        {props.highlightWord && props.punchline.includes(props.highlightWord) ? (
          <>
            <span>{props.punchline.substring(0, props.punchline.indexOf(props.highlightWord))}</span>
            <span
              style={{
                color: theme.colors.accentYellow,
                textShadow: `0 0 20px ${theme.colors.accentYellowGlow}`,
              }}
            >
              {props.highlightWord}
            </span>
            <span>
              {props.punchline.substring(
                props.punchline.indexOf(props.highlightWord) + props.highlightWord.length
              )}
            </span>
          </>
        ) : (
          <span>{props.punchline}</span>
        )}
      </div>
    </div>
  );
};
