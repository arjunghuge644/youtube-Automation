import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { StatisticsProps } from '@creatorflow/shared';

export const StatisticsScene: React.FC<{ props: StatisticsProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const primaryEntrance = spring({
    frame: frame - 12,
    fps,
    config: theme.springs.bouncy,
  });

  const isUp = props.primaryStat.trend !== 'down';
  const trendColor = isUp ? theme.colors.accentEmerald : theme.colors.accentCoral;
  const trendArrow = isUp ? '↑' : '↓';

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
      {/* Headline */}
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
        <span
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '24px',
            fontWeight: 800,
            color: theme.colors.textPrimary,
            textAlign: 'center',
          }}
        >
          {props.headline}
        </span>
        {props.subheadline && (
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '13px',
              color: theme.colors.textMuted,
            }}
          >
            {props.subheadline}
          </span>
        )}
      </div>

      {/* Primary Massive KPI Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(13, 27, 58, 0.95)',
          border: `2px solid ${theme.colors.accentYellow}`,
          borderRadius: '16px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          boxShadow: `0 0 35px ${theme.colors.accentYellowGlow}`,
          opacity: primaryEntrance,
          transform: `scale(${interpolate(primaryEntrance, [0, 1], [0.9, 1])})`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '54px',
              fontWeight: 900,
              color: theme.colors.accentYellow,
              lineHeight: 1,
              letterSpacing: '-1px',
            }}
          >
            {props.primaryStat.value}
          </span>
          {props.primaryStat.unit && (
            <span
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '22px',
                fontWeight: 700,
                color: theme.colors.textMuted,
              }}
            >
              {props.primaryStat.unit}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '16px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
            }}
          >
            {props.primaryStat.label}
          </span>
          {props.primaryStat.change && (
            <span
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '13px',
                fontWeight: 800,
                color: trendColor,
                background: `${trendColor}18`,
                padding: '2px 8px',
                borderRadius: '6px',
                border: `1px solid ${trendColor}44`,
              }}
            >
              {trendArrow} {props.primaryStat.change}
            </span>
          )}
        </div>
      </div>

      {/* Secondary Stats Grid */}
      {props.secondaryStats && props.secondaryStats.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            maxWidth: '560px',
            justifyContent: 'center',
          }}
        >
          {props.secondaryStats.map((stat, idx) => {
            const statEntrance = spring({
              frame: frame - (idx * 8 + 22),
              fps,
              config: theme.springs.snappy,
            });

            const color = stat.accentColor || theme.colors.accentCyan;

            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  background: theme.colors.cardBgSolid,
                  border: `1.5px solid ${theme.colors.cardBorder}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: statEntrance,
                  transform: `translateY(${interpolate(statEntrance, [0, 1], [15, 0])}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: '24px',
                    fontWeight: 900,
                    color,
                  }}
                >
                  {stat.value}
                </span>
                <span
                  style={{
                    fontFamily: theme.fonts.sans,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.colors.textSecondary,
                    textAlign: 'center',
                  }}
                >
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart Bars if provided */}
      {props.chartData && props.chartData.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(12, 23, 50, 0.7)',
            padding: '16px',
            borderRadius: '12px',
            border: `1px solid ${theme.colors.cardBorder}`,
          }}
        >
          {props.chartData.map((bar, idx) => {
            const maxVal = bar.maxValue || 100;
            const progress = interpolate(
              frame - (idx * 6 + 28),
              [0, 20],
              [0, (bar.value / maxVal) * 100],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            const barColor = bar.color || (idx === 0 ? theme.colors.accentEmerald : theme.colors.accentCyan);

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '13px',
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {bar.label}
                  </span>
                  <span
                    style={{
                      fontFamily: theme.fonts.mono,
                      fontSize: '13px',
                      fontWeight: 700,
                      color: barColor,
                    }}
                  >
                    {bar.value}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '10px',
                    borderRadius: '5px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: barColor,
                      borderRadius: '5px',
                      boxShadow: `0 0 10px ${barColor}88`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

