import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { KineticTypographyProps } from '@creatorflow/shared';

export const KineticTypographyScene: React.FC<{ props: KineticTypographyProps }> = ({
  props,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Heading spring
  const headingEntrance = spring({
    frame: frame - 5,
    fps,
    config: theme.springs.snappy,
  });

  // Punchline spring
  const punchlineEntrance = spring({
    frame: frame - 16,
    fps,
    config: theme.springs.bouncy,
  });

  // Card spring
  const cardEntrance = spring({
    frame: frame - 25,
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
        textAlign: 'center',
      }}
    >
      {/* Badges / Checklist Items */}
      {props.badges && props.badges.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            alignItems: 'flex-start',
            width: '100%',
          }}
        >
          {props.badges.map((b, idx) => {
            const badgeEntrance = spring({
              frame: frame - (idx * 12 + 6),
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
                  gap: '16px',
                  fontFamily: theme.fonts.sans,
                  fontSize: '34px',
                  fontWeight: 800,
                  color: isSuccess ? theme.colors.textPrimary : theme.colors.accentCoral,
                  opacity: badgeEntrance,
                  transform: `translateX(${interpolate(badgeEntrance, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: `2px solid ${iconColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    color: iconColor,
                    boxShadow: `0 0 12px ${iconColor}66`,
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
            width: '80%',
            backgroundColor: theme.colors.cardBg,
            border: `2px solid ${theme.colors.cardBorder}`,
            borderRadius: '24px',
            padding: '36px 28px',
            boxSizing: 'border-box',
            opacity: cardEntrance,
            transform: `scale(${interpolate(cardEntrance, [0, 1], [0.92, 1])})`,
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
            marginTop: '16px',
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '15px',
              letterSpacing: '2px',
              color: theme.colors.textMuted,
              marginBottom: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            {props.card.tag}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '44px',
              fontWeight: 800,
              color: theme.colors.textPrimary,
              marginBottom: '8px',
              letterSpacing: '1px',
            }}
          >
            {props.card.title}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '18px',
              color: theme.colors.textMuted,
            }}
          >
            {props.card.subtitle}
          </div>
        </div>
      )}

      {/* Heading */}
      {props.heading && (
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '42px',
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

      {/* Big Impact Punchline */}
      <div
        style={{
          fontFamily: theme.fonts.sans,
          fontSize: '48px',
          fontWeight: 800,
          lineHeight: 1.25,
          color: theme.colors.textPrimary,
          opacity: punchlineEntrance,
          transform: `scale(${interpolate(punchlineEntrance, [0, 1], [0.9, 1])})`,
          textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          marginTop: '20px',
        }}
      >
        {props.highlightWord && props.punchline.includes(props.highlightWord) ? (
          <>
            <span>{props.punchline.substring(0, props.punchline.indexOf(props.highlightWord))}</span>
            <span
              style={{
                color: theme.colors.accentYellow,
                textShadow: `0 0 16px ${theme.colors.accentYellowGlow}`,
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
