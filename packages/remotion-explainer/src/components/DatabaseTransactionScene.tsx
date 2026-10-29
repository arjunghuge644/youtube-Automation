import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { DatabaseTransactionProps } from '@creatorflow/shared';

export const DatabaseTransactionScene: React.FC<{ props: DatabaseTransactionProps }> = ({
  props,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Progress-based storytelling milestones
  const payDelay = Math.round(durationInFrames * 0.16);
  const step1Delay = Math.round(durationInFrames * 0.28);
  const crashFrame = Math.round(durationInFrames * 0.50);
  const impactDelay = Math.round(durationInFrames * 0.66);

  const payClicked = frame >= payDelay;
  const payHighlight = spring({
    frame: frame - payDelay,
    fps,
    config: theme.springs.bouncy,
  });

  const dbEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const isCrashed = frame >= crashFrame;
  const crashFlash = isCrashed && (frame - crashFrame) < 12 ? (frame % 2 === 0 ? 1 : 0.4) : 1;
  const crashShake =
    isCrashed && (frame - crashFrame) < 16
      ? Math.sin((frame - crashFrame) * 1.5) * Math.max(0, 16 - (frame - crashFrame))
      : 0;

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
        transform: `translateX(${crashShake}px)`,
      }}
    >
      {/* Top Transaction Receipt Bar */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBgSolid,
          border: `1.5px solid ${theme.colors.cardBorder}`,
          borderRadius: '16px',
          padding: '18px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: theme.fonts.mono,
          boxSizing: 'border-box',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            fontSize: '18px',
            color: theme.colors.textPrimary,
            letterSpacing: '0.8px',
            fontWeight: 700,
          }}
        >
          <span style={{ color: theme.colors.accentYellow }}>{props.transaction.time}</span> ·{' '}
          {props.transaction.item} · {props.transaction.amount}
        </div>
        <div
          style={{
            padding: '8px 24px',
            borderRadius: '10px',
            backgroundColor: payClicked ? theme.colors.accentYellow : 'transparent',
            border: `2px solid ${theme.colors.accentYellow}`,
            color: payClicked ? '#080F22' : theme.colors.accentYellow,
            fontWeight: 900,
            fontSize: '17px',
            letterSpacing: '2px',
            transform: payClicked ? `scale(${interpolate(payHighlight, [0, 1], [0.9, 1.05])})` : 'scale(1)',
            boxShadow: payClicked ? `0 0 20px ${theme.colors.accentYellowGlow}` : 'none',
          }}
        >
          PAY
        </div>
      </div>

      {/* Main Database Container Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBgSolid,
          border: `2px solid ${isCrashed ? theme.colors.accentCoral : theme.colors.cardBorder}`,
          borderRadius: '24px',
          padding: '32px 36px',
          boxSizing: 'border-box',
          opacity: dbEntrance,
          transform: `scale(${interpolate(dbEntrance, [0, 1], [0.95, 1])})`,
          boxShadow: isCrashed ? `0 0 32px ${theme.colors.accentCoralGlow}` : '0 16px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* DB Header with Cylinder */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1.5px solid ${theme.colors.cardBorder}`,
            paddingBottom: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <svg width="40" height="46" viewBox="0 0 40 48" fill="none">
              <ellipse cx="20" cy="12" rx="18" ry="8" stroke={theme.colors.accentYellow} strokeWidth="2.5" />
              <path
                d="M2 12 V 36 C 2 40.4 10.05 44 20 44 C 29.95 44 38 40.4 38 36 V 12"
                stroke={theme.colors.accentYellow}
                strokeWidth="2.5"
              />
              <path d="M2 24 C 2 28.4 10.05 32 20 32 C 29.95 32 38 28.4 38 24" stroke={theme.colors.accentYellow} strokeWidth="2.5" />
            </svg>
            <div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '26px',
                  fontWeight: 900,
                  letterSpacing: '2.5px',
                  color: theme.colors.accentYellow,
                }}
              >
                {props.database.name.toUpperCase()}
              </div>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: '13px', color: theme.colors.textMuted }}>
                {props.database.type}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: isCrashed ? 'rgba(255, 92, 92, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1.5px solid ${isCrashed ? theme.colors.accentCoral : theme.colors.accentEmerald}`,
              fontFamily: theme.fonts.mono,
              fontSize: '14px',
              fontWeight: 800,
              color: isCrashed ? theme.colors.accentCoral : theme.colors.accentEmerald,
              letterSpacing: '1px',
            }}
          >
            {isCrashed ? 'DISCONNECTED' : 'ONLINE'}
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
          {props.database.columns.map((col, index) => {
            // Live debit value
            const isWallet = col.label.toUpperCase().includes('WALLET');
            const displayVal = isWallet && frame >= step1Delay ? '₹750' : col.value;

            return (
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
                    fontSize: '16px',
                    letterSpacing: '2px',
                    color: theme.colors.textMuted,
                    marginBottom: '8px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {col.label}
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.sans,
                    fontSize: '48px',
                    fontWeight: 900,
                    color: col.color || theme.colors.textPrimary,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {displayVal}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Steps & Crash Flow */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {props.steps.map((step, idx) => {
          const stepTrigger = idx === 0 ? step1Delay : crashFrame;
          const isFailed = step.status === 'failed' || (idx === 1 && isCrashed);
          const isSuccess = step.status === 'success' || (idx === 0 && frame >= step1Delay);

          const stepEntrance = spring({
            frame: frame - stepTrigger,
            fps,
            config: theme.springs.snappy,
          });

          return (
            <React.Fragment key={step.stepNumber}>
              {/* Lightning Crash Alert between step 1 and step 2 */}
              {idx === 1 && isCrashed && (
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    backgroundColor: 'rgba(255, 92, 92, 0.15)',
                    border: `1.5px solid ${theme.colors.accentCoral}`,
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: theme.colors.accentCoral,
                    fontFamily: theme.fonts.mono,
                    fontSize: '17px',
                    fontWeight: 800,
                    letterSpacing: '2.5px',
                    opacity: crashFlash,
                    boxShadow: `0 0 16px ${theme.colors.accentCoralGlow}`,
                  }}
                >
                  <span style={{ fontSize: '22px' }}>⚡</span>
                  <span>{props.crashAlert?.message || 'SERVER CRASH · CONNECTION LOST'}</span>
                </div>
              )}

              {frame >= stepTrigger && (
                <div
                  style={{
                    width: '100%',
                    backgroundColor: theme.colors.cardBgSolid,
                    border: isFailed
                      ? `2px dashed ${theme.colors.accentCoral}`
                      : `2px solid ${theme.colors.accentEmerald}`,
                    borderRadius: '18px',
                    padding: '20px 28px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transform: `translateY(${interpolate(stepEntrance, [0, 1], [20, 0])}px)`,
                    opacity: stepEntrance,
                    boxShadow: isFailed
                      ? `0 0 24px ${theme.colors.accentCoralGlow}`
                      : `0 0 16px rgba(16, 185, 129, 0.25)`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        border: `2px solid ${isFailed ? theme.colors.accentCoral : theme.colors.accentEmerald}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: theme.fonts.mono,
                        fontSize: '18px',
                        fontWeight: 900,
                        color: isFailed ? theme.colors.accentCoral : theme.colors.accentEmerald,
                      }}
                    >
                      {step.stepNumber}
                    </div>
                    <div
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: '28px',
                        fontWeight: 800,
                        color: isFailed ? theme.colors.accentCoral : theme.colors.textPrimary,
                      }}
                    >
                      {step.title}
                    </div>
                  </div>

                  {/* Status Indicator Icon */}
                  <div
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '32px',
                      fontWeight: 900,
                      color: isFailed ? theme.colors.accentCoral : theme.colors.accentEmerald,
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

      {/* Impact Punchline Callout Card */}
      {frame >= impactDelay && props.impactText && (
        <div
          style={{
            width: '100%',
            backgroundColor: 'rgba(255, 92, 92, 0.12)',
            border: `2px solid ${theme.colors.accentCoral}`,
            borderRadius: '16px',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            boxShadow: `0 0 28px ${theme.colors.accentCoralGlow}`,
            transform: `scale(${interpolate(
              spring({ frame: frame - impactDelay, fps, config: theme.springs.bouncy }),
              [0, 1],
              [0.9, 1]
            )})`,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: theme.colors.accentCoral,
              textTransform: 'uppercase',
            }}
          >
            CRITICAL SYSTEM FAILURE
          </span>
          <span
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '34px',
              fontWeight: 900,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            {props.impactText.text} · 0 Orders
          </span>
          <span style={{ fontFamily: theme.fonts.mono, fontSize: '13px', color: theme.colors.textMuted }}>
            Money lost without ACID transaction guarantees
          </span>
        </div>
      )}
    </div>
  );
};
