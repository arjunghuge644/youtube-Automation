import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { ProcessTimelineProps } from '@creatorflow/shared';

export const ProcessTimelineScene: React.FC<{ props: ProcessTimelineProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.accentEmerald;
      case 'in_progress':
        return theme.colors.accentYellow;
      case 'failed':
        return theme.colors.accentCoral;
      default:
        return theme.colors.textMuted;
    }
  };

  const getStatusIcon = (status: string, stepNumber: number) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'in_progress':
        return '▶';
      case 'failed':
        return '✕';
      default:
        return `${stepNumber}`;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 36px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '24px',
      }}
    >
      {/* Title */}
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
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            color: theme.colors.accentEmerald,
            textTransform: 'uppercase',
          }}
        >
          {props.title}
        </span>
        {props.subtitle && (
          <span
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '22px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {props.subtitle}
          </span>
        )}
      </div>

      {/* Timeline Steps Stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '0px',
          width: '100%',
          maxWidth: '560px',
          position: 'relative',
        }}
      >
        {props.steps.map((step, idx) => {
          const stepEntrance = spring({
            frame: frame - (idx * 12 + 8),
            fps,
            config: theme.springs.snappy,
          });

          const isCurrent = idx === props.currentStepIndex || step.status === 'in_progress';
          const statusColor = getStatusColor(step.status);
          const pulse = isCurrent ? Math.sin(frame * 0.2) * 3 : 0;

          return (
            <div
              key={step.stepNumber}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%',
                position: 'relative',
                paddingBottom: idx === props.steps.length - 1 ? '0px' : '20px',
                opacity: stepEntrance,
                transform: `translateX(${interpolate(stepEntrance, [0, 1], [-20, 0])}px)`,
              }}
            >
              {/* Vertical connector line */}
              {idx < props.steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    left: '19px',
                    top: '38px',
                    bottom: '0px',
                    width: '2px',
                    background: step.status === 'completed'
                      ? theme.colors.accentEmerald
                      : 'rgba(92, 131, 195, 0.3)',
                    zIndex: 1,
                  }}
                />
              )}

              {/* Node indicator */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isCurrent ? theme.colors.accentYellow : theme.colors.cardBgSolid,
                  border: `2px solid ${statusColor}`,
                  color: isCurrent ? '#080F22' : statusColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: theme.fonts.mono,
                  fontWeight: 900,
                  fontSize: '15px',
                  zIndex: 2,
                  boxShadow: isCurrent ? `0 0 18px ${theme.colors.accentYellowGlow}` : undefined,
                  transform: `scale(${1 + pulse * 0.02})`,
                  flexShrink: 0,
                }}
              >
                {getStatusIcon(step.status, step.stepNumber)}
              </div>

              {/* Step Details Card */}
              <div
                style={{
                  marginLeft: '16px',
                  flex: 1,
                  background: isCurrent ? 'rgba(255, 209, 102, 0.1)' : theme.colors.cardBg,
                  border: `1.5px solid ${isCurrent ? theme.colors.accentYellow : theme.colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '18px',
                      fontWeight: 800,
                      color: isCurrent ? theme.colors.accentYellow : theme.colors.textPrimary,
                    }}
                  >
                    {step.title}
                  </span>
                  {step.duration && (
                    <span
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: '12px',
                        color: theme.colors.textMuted,
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {step.duration}
                    </span>
                  )}
                </div>
                {step.description && (
                  <span
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '13px',
                      color: theme.colors.textSecondary,
                      lineHeight: 1.35,
                    }}
                  >
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metric Badge */}
      {props.metric && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 22px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: `1.5px solid ${theme.colors.accentEmerald}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            opacity: spring({ frame: frame - 40, fps, config: theme.springs.gentle }),
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '13px',
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
            }}
          >
            {props.metric.label}:
          </span>
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '18px',
              fontWeight: 900,
              color: theme.colors.accentEmerald,
            }}
          >
            {props.metric.value}
          </span>
        </div>
      )}
    </div>
  );
};

