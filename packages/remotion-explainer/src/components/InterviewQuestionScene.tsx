import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { InterviewQuestionProps } from '@creatorflow/shared';

export const InterviewQuestionScene: React.FC<{ props: InterviewQuestionProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Dynamic progress-based milestone timing
  const cardEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  // Cursor blink
  const cursorVisible = Math.floor(frame / (fps / 2)) % 2 === 0;

  // Question underline reveal scales with the first 25% of scene duration
  const underlineEndFrame = Math.max(15, Math.round(durationInFrames * 0.22));
  const underlineProgress = interpolate(frame, [8, underlineEndFrame], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
        gap: '28px',
      }}
    >
      {/* Interviewer Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.cardBorder}`,
          borderRadius: '24px',
          padding: '42px 38px',
          boxSizing: 'border-box',
          transform: `scale(${interpolate(cardEntrance, [0, 1], [0.94, 1])}) translateY(${interpolate(
            cardEntrance,
            [0, 1],
            [25, 0]
          )}px)`,
          opacity: cardEntrance,
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
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
            fontWeight: 800,
            letterSpacing: '2.5px',
            color: theme.colors.textMuted,
            marginBottom: '28px',
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
                boxShadow: `0 0 12px ${theme.colors.accentYellow}`,
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
            fontSize: '38px',
            lineHeight: 1.35,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            marginBottom: '32px',
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
                    boxShadow: `0 0 10px ${theme.colors.accentYellowGlow}`,
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
            fontSize: '46px',
            fontWeight: 900,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
        {props.options.map((option, index) => {
          // Dynamic staging based on duration
          const optionDelay = Math.round(durationInFrames * (0.24 + index * 0.22));
          const optionEntrance = spring({
            frame: frame - optionDelay,
            fps,
            config: theme.springs.snappy,
          });

          // Strikethrough animation
          const strikeDelay = optionDelay + Math.round(durationInFrames * 0.08);
          const strikeProgress = interpolate(frame, [strikeDelay, strikeDelay + Math.round(fps * 0.4)], [0, 100], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          // Badge pop
          const badgeDelay = strikeDelay + Math.round(fps * 0.3);
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
                gap: '8px',
                opacity: optionEntrance,
                transform: `translateY(${interpolate(optionEntrance, [0, 1], [25, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '15px',
                  letterSpacing: '2px',
                  color: theme.colors.textMuted,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  paddingLeft: '72px',
                }}
              >
                {option.label}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                }}
              >
                {/* Number Circle */}
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    border: `2px solid ${theme.colors.cardBorderHighlight}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: theme.fonts.mono,
                    fontSize: '22px',
                    fontWeight: 900,
                    color: theme.colors.accentYellow,
                    backgroundColor: theme.colors.cardBgSolid,
                    flexShrink: 0,
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {option.id}
                </div>

                {/* Pill Container */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.cardBgSolid,
                    border: `2px solid ${option.strikethrough && frame >= strikeDelay ? 'rgba(255, 92, 92, 0.5)' : theme.colors.cardBorder}`,
                    borderRadius: '18px',
                    padding: '22px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'visible',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  {/* Text with Strikethrough */}
                  <div
                    style={{
                      position: 'relative',
                      fontFamily: theme.fonts.sans,
                      fontSize: '30px',
                      fontWeight: 800,
                      color: option.strikethrough && frame >= strikeDelay ? theme.colors.textSecondary : theme.colors.textPrimary,
                    }}
                  >
                    {option.text}
                    {option.strikethrough && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '-4%',
                          top: '50%',
                          height: '5px',
                          width: `${strikeProgress * 1.08}%`,
                          backgroundColor: theme.colors.accentCoral,
                          boxShadow: `0 0 12px ${theme.colors.accentCoralGlow}`,
                          borderRadius: '3px',
                        }}
                      />
                    )}
                  </div>

                  {/* Tilted Tag Badge */}
                  {option.badge && badgePop > 0.01 && (
                    <div
                      style={{
                        transform: `scale(${badgePop}) rotate(-4deg)`,
                        border: `1.5px solid ${theme.colors.accentCoral}`,
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontFamily: theme.fonts.mono,
                        fontSize: '14px',
                        fontWeight: 900,
                        letterSpacing: '1.5px',
                        color: theme.colors.accentCoral,
                        backgroundColor: 'rgba(255, 92, 92, 0.15)',
                        boxShadow: `0 0 14px ${theme.colors.accentCoralGlow}`,
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
    </div>
  );
};
