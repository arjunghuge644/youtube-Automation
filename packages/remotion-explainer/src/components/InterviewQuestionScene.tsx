import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { InterviewQuestionProps } from '@creatorflow/shared';

export const InterviewQuestionScene: React.FC<{ props: InterviewQuestionProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance
  const cardEntrance = spring({
    frame: frame - 5,
    fps,
    config: theme.springs.snappy,
  });

  // Cursor blink
  const cursorVisible = Math.floor(frame / (fps / 2)) % 2 === 0;

  // Question underline reveal
  const underlineProgress = interpolate(frame, [15, 30], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
        gap: '36px',
      }}
    >
      {/* Interviewer Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.cardBorder}`,
          borderRadius: '24px',
          padding: '40px 36px',
          boxSizing: 'border-box',
          transform: `scale(${interpolate(cardEntrance, [0, 1], [0.92, 1])}) translateY(${interpolate(
            cardEntrance,
            [0, 1],
            [30, 0]
          )}px)`,
          opacity: cardEntrance,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: theme.fonts.mono,
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: theme.colors.textMuted,
            marginBottom: '32px',
          }}
        >
          <div style={{ color: theme.colors.accentCyan }}>{props.headerText}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.colors.accentYellow }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: theme.colors.accentYellow,
                boxShadow: `0 0 10px ${theme.colors.accentYellow}`,
                display: 'inline-block',
              }}
            />
            <span>{props.timestampText}</span>
          </div>
        </div>

        {/* Question Text */}
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '36px',
            lineHeight: 1.35,
            fontWeight: 700,
            color: theme.colors.textPrimary,
            marginBottom: '36px',
          }}
        >
          {props.underlinedKeyword && props.question.includes(props.underlinedKeyword) ? (
            <>
              {props.question.substring(0, props.question.indexOf(props.underlinedKeyword))}
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                {props.underlinedKeyword}
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: -4,
                    height: '4px',
                    width: `${underlineProgress}%`,
                    backgroundColor: theme.colors.accentYellow,
                    borderRadius: '2px',
                    boxShadow: `0 0 8px ${theme.colors.accentYellowGlow}`,
                  }}
                />
              </span>
              {props.question.substring(
                props.question.indexOf(props.underlinedKeyword) + props.underlinedKeyword.length
              )}
            </>
          ) : (
            props.question
          )}
        </div>

        {/* Punchline with Cursor */}
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '44px',
            fontWeight: 800,
            color: theme.colors.textPrimary,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {props.highlightWord && props.punchline.includes(props.highlightWord) ? (
            <>
              <span>{props.punchline.substring(0, props.punchline.indexOf(props.highlightWord))}</span>
              <span style={{ color: theme.colors.accentYellow }}>{props.highlightWord}</span>
              <span>
                {props.punchline.substring(
                  props.punchline.indexOf(props.highlightWord) + props.highlightWord.length
                )}
              </span>
            </>
          ) : (
            <span>{props.punchline}</span>
          )}
          <span
            style={{
              color: theme.colors.accentYellow,
              fontWeight: 300,
              opacity: cursorVisible ? 1 : 0,
            }}
          >
            |
          </span>
        </div>
      </div>

      {/* Candidate Comparison Options */}
      {props.options.map((option, index) => {
        const optionDelay = 25 + index * 18;
        const optionEntrance = spring({
          frame: frame - optionDelay,
          fps,
          config: theme.springs.snappy,
        });

        // Strikethrough animation
        const strikeDelay = optionDelay + 12;
        const strikeProgress = interpolate(frame, [strikeDelay, strikeDelay + 14], [0, 100], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Badge pop
        const badgeDelay = strikeDelay + 10;
        const badgePop = spring({
          frame: frame - badgeDelay,
          fps,
          config: theme.springs.bouncy,
        });

        return (
          <div
            key={option.id}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              opacity: optionEntrance,
              transform: `translateY(${interpolate(optionEntrance, [0, 1], [25, 0])}px)`,
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '14px',
                letterSpacing: '2px',
                color: theme.colors.textSubtle,
                fontWeight: 600,
                textTransform: 'uppercase',
                paddingLeft: '64px',
              }}
            >
              {option.label}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                width: '100%',
              }}
            >
              {/* Number Circle */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: `2px solid ${theme.colors.cardBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: theme.fonts.mono,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: theme.colors.textMuted,
                  flexShrink: 0,
                }}
              >
                {option.id}
              </div>

              {/* Pill Container */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.cardBg,
                  border: `1.5px solid ${theme.colors.cardBorder}`,
                  borderRadius: '16px',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* Text with Strikethrough */}
                <div
                  style={{
                    position: 'relative',
                    fontFamily: theme.fonts.sans,
                    fontSize: '28px',
                    fontWeight: 700,
                    color: option.strikethrough ? theme.colors.textSecondary : theme.colors.textPrimary,
                  }}
                >
                  {option.text}
                  {option.strikethrough && (
                    <div
                      style={{
                        position: 'absolute',
                        left: '-4%',
                        top: '52%',
                        height: '4px',
                        width: `${strikeProgress * 1.08}%`,
                        backgroundColor: theme.colors.accentCoral,
                        boxShadow: `0 0 10px ${theme.colors.accentCoralGlow}`,
                        borderRadius: '2px',
                      }}
                    />
                  )}
                </div>

                {/* Tilted Tag Badge */}
                {option.badge && badgePop > 0.01 && (
                  <div
                    style={{
                      transform: `scale(${badgePop}) rotate(-4deg)`,
                      border: `1.5px solid ${theme.colors.accentYellow}`,
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontFamily: theme.fonts.mono,
                      fontSize: '14px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      color: theme.colors.accentYellow,
                      backgroundColor: theme.colors.cardBgSolid,
                      boxShadow: `0 0 12px ${theme.colors.accentYellowGlow}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {option.badge}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
