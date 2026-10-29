import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { DatabaseTransactionProps } from '@creatorflow/shared';

export const DatabaseTransactionScene: React.FC<{ props: DatabaseTransactionProps }> = ({
  props,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pay button click effect around frame 20
  const payClicked = frame > 18;
  const payHighlight = spring({
    frame: frame - 18,
    fps,
    config: theme.springs.bouncy,
  });

  // Database card entrance
  const dbEntrance = spring({
    frame: frame - 5,
    fps,
    config: theme.springs.snappy,
  });

  // Crash event timing
  const crashFrame = 40;
  const isCrashed = frame >= crashFrame;
  const crashFlash = isCrashed && (frame - crashFrame) < 8 ? (frame % 2 === 0 ? 1 : 0.4) : 1;
  const crashShake =
    isCrashed && (frame - crashFrame) < 14
      ? Math.sin((frame - crashFrame) * 1.5) * (14 - (frame - crashFrame))
      : 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 48px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '30px',
        transform: `translateX(${crashShake}px)`,
      }}
    >
      {/* Top Transaction Action Bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `1.5px solid ${theme.colors.cardBorder}`,
          borderRadius: '16px',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: theme.fonts.mono,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: '17px',
            color: theme.colors.textPrimary,
            letterSpacing: '0.8px',
          }}
        >
          <span style={{ color: theme.colors.accentYellow }}>{props.transaction.time}</span> ·{' '}
          {props.transaction.item} · {props.transaction.amount} · {props.transaction.paymentMethod}
        </div>
        <div
          style={{
            padding: '8px 22px',
            borderRadius: '10px',
            backgroundColor: payClicked ? theme.colors.accentYellow : 'transparent',
            border: `1.5px solid ${theme.colors.accentYellow}`,
            color: payClicked ? '#000000' : theme.colors.accentYellow,
            fontWeight: 800,
            fontSize: '16px',
            letterSpacing: '2px',
            transform: payClicked ? `scale(${interpolate(payHighlight, [0, 1], [0.9, 1.05])})` : 'scale(1)',
            boxShadow: payClicked ? `0 0 16px ${theme.colors.accentYellowGlow}` : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          PAY
        </div>
      </div>

      {/* Main Database Container Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.cardBorder}`,
          borderRadius: '24px',
          padding: '32px 36px',
          boxSizing: 'border-box',
          opacity: dbEntrance,
          transform: `scale(${interpolate(dbEntrance, [0, 1], [0.94, 1])})`,
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* DB Header with Cylinder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            borderBottom: `1.5px solid ${theme.colors.cardBorder}`,
            paddingBottom: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Cylinder SVG Icon */}
          <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
            <ellipse cx="20" cy="12" rx="18" ry="8" stroke={theme.colors.cardBorderHighlight} strokeWidth="2.5" />
            <path
              d="M2 12 V 36 C 2 40.4 10.05 44 20 44 C 29.95 44 38 40.4 38 36 V 12"
              stroke={theme.colors.cardBorderHighlight}
              strokeWidth="2.5"
            />
            <path d="M2 24 C 2 28.4 10.05 32 20 32 C 29.95 32 38 28.4 38 24" stroke={theme.colors.cardBorderHighlight} strokeWidth="2.5" />
          </svg>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '2.5px',
              color: theme.colors.accentYellow,
            }}
          >
            {props.database.name.toUpperCase()}
          </div>
        </div>

        {/* Balance / Column Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${props.database.columns.length}, 1fr)`,
            gap: '24px',
            textAlign: 'center',
          }}
        >
          {props.database.columns.map((col, index) => (
            <div
              key={index}
              style={{
                borderLeft: index > 0 ? `1.5px solid ${theme.colors.cardBorder}` : 'none',
                paddingLeft: index > 0 ? '24px' : '0',
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
                {col.label}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.sans,
                  fontSize: '44px',
                  fontWeight: 800,
                  color: col.color || theme.colors.textPrimary,
                  letterSpacing: '-0.5px',
                }}
              >
                {col.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction Steps & Crash Flow */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {props.steps.map((step, idx) => {
          const stepDelay = 22 + idx * 24;
          const isFailed = step.status === 'failed' || (idx === 1 && isCrashed);
          const isSuccess = step.status === 'success' || (idx === 0 && frame >= stepDelay);

          const stepEntrance = spring({
            frame: frame - stepDelay,
            fps,
            config: theme.springs.snappy,
          });

          return (
            <React.Fragment key={step.stepNumber}>
              {/* Lightning Crash Alert between step 1 and step 2 */}
              {idx === 1 && isCrashed && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: theme.colors.accentCoral,
                    fontFamily: theme.fonts.mono,
                    fontSize: '16px',
                    fontWeight: 800,
                    letterSpacing: '2.5px',
                    opacity: crashFlash,
                    padding: '6px 0',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <span>{props.crashAlert?.message || 'SERVER CRASH'}</span>
                </div>
              )}

              {frame >= stepDelay && (
                <div
                  style={{
                    width: '100%',
                    backgroundColor: theme.colors.cardBg,
                    border: isFailed
                      ? `2px dashed ${theme.colors.accentCoral}`
                      : `2px solid ${theme.colors.accentYellow}`,
                    borderRadius: '18px',
                    padding: '20px 28px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transform: `translateY(${interpolate(stepEntrance, [0, 1], [20, 0])}px)`,
                    opacity: stepEntrance,
                    boxShadow: isFailed
                      ? `0 0 20px ${theme.colors.accentCoralGlow}`
                      : `0 0 16px ${theme.colors.accentYellowGlow}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: `1.5px solid ${isFailed ? theme.colors.accentCoral : theme.colors.accentYellow}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: theme.fonts.mono,
                        fontSize: '16px',
                        fontWeight: 700,
                        color: isFailed ? theme.colors.accentCoral : theme.colors.accentYellow,
                      }}
                    >
                      {step.stepNumber}
                    </div>
                    <div
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: '30px',
                        fontWeight: 700,
                        color: isFailed ? theme.colors.textMuted : theme.colors.textPrimary,
                      }}
                    >
                      {step.title}
                    </div>
                  </div>

                  {/* Status Indicator Icon */}
                  <div
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '30px',
                      fontWeight: 900,
                      color: isFailed ? theme.colors.accentCoral : theme.colors.accentYellow,
                    }}
                  >
                    {isFailed ? '✕' : isSuccess ? '✓' : ''}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Impact Punchline Text */}
      {isCrashed && props.impactText && (
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '52px',
            fontWeight: 800,
            color: props.impactText.color || theme.colors.accentCoral,
            textAlign: 'center',
            marginTop: '16px',
            textShadow: `0 0 24px ${theme.colors.accentCoralGlow}`,
            transform: `scale(${interpolate(
              spring({ frame: frame - (crashFrame + 6), fps, config: theme.springs.bouncy }),
              [0, 1],
              [0.85, 1]
            )})`,
          }}
        >
          {props.impactText.text}
        </div>
      )}
    </div>
  );
};
