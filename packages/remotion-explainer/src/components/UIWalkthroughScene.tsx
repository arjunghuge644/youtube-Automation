import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { UIWalkthroughProps } from '@creatorflow/shared';

export const UIWalkthroughScene: React.FC<{ props: UIWalkthroughProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const windowEntrance = spring({
    frame: frame - 6,
    fps,
    config: theme.springs.snappy,
  });

  const ctaEntrance = spring({
    frame: frame - 40,
    fps,
    config: theme.springs.gentle,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 28px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '20px',
      }}
    >
      {/* App Header Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '13px',
            fontWeight: 700,
            color: theme.colors.accentCyan,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {props.appName}
        </span>
        <span style={{ color: theme.colors.textMuted }}>·</span>
        <span style={{ fontFamily: theme.fonts.mono, fontSize: '13px', color: theme.colors.textMuted }}>
          {props.windowTitle}
        </span>
      </div>

      {/* Browser/Window Mockup Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'rgba(12, 23, 50, 0.95)',
          border: `2px solid ${theme.colors.cardBorder}`,
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          opacity: windowEntrance,
          transform: `scale(${interpolate(windowEntrance, [0, 1], [0.93, 1])})`,
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            height: '38px',
            background: 'rgba(8, 15, 34, 0.9)',
            borderBottom: `1px solid ${theme.colors.cardBorder}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '6px',
              padding: '2px 14px',
              fontFamily: theme.fonts.mono,
              fontSize: '11px',
              color: theme.colors.textMuted,
            }}
          >
            https://{props.appUrl}
          </div>

          <div style={{ width: '38px' }} />
        </div>

        {/* Mockup Body with Highlights */}
        <div
          style={{
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Top Quick Metrics */}
          {props.previewMetrics && props.previewMetrics.length > 0 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {props.previewMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${theme.colors.cardBorder}`,
                    borderRadius: '8px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textMuted }}>
                    {metric.label}
                  </span>
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: '15px', fontWeight: 800, color: theme.colors.accentEmerald }}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Feature Highlights */}
          {props.highlights.map((feat, idx) => {
            const featEntrance = spring({
              frame: frame - (idx * 12 + 15),
              fps,
              config: theme.springs.snappy,
            });

            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(56, 189, 248, 0.07)',
                  border: `1.5px solid ${theme.colors.accentCyan}`,
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  opacity: featEntrance,
                  transform: `translateX(${interpolate(featEntrance, [0, 1], [-15, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: theme.colors.accentCyan,
                    color: '#080F22',
                    fontFamily: theme.fonts.mono,
                    fontWeight: 900,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {feat.stepNumber || idx + 1}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: theme.fonts.sans, fontSize: '15px', fontWeight: 800, color: theme.colors.textPrimary }}>
                      {feat.title}
                    </span>
                    {feat.badge && (
                      <span
                        style={{
                          fontFamily: theme.fonts.mono,
                          fontSize: '10px',
                          color: theme.colors.accentYellow,
                          background: 'rgba(255, 209, 102, 0.15)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: theme.fonts.sans, fontSize: '12px', color: theme.colors.textSecondary, lineHeight: 1.3 }}>
                    {feat.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      {props.callToAction && (
        <div
          style={{
            marginTop: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            opacity: ctaEntrance,
            transform: `translateY(${interpolate(ctaEntrance, [0, 1], [15, 0])}px)`,
          }}
        >
          <div
            style={{
              padding: '14px 28px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${theme.colors.accentCyan}, #2563EB)`,
              boxShadow: `0 0 25px rgba(56, 189, 248, 0.4)`,
              color: '#FFFFFF',
              fontFamily: theme.fonts.sans,
              fontWeight: 800,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>{props.callToAction.buttonLabel || 'Get Started Now'}</span>
            <span>➔</span>
          </div>
          {props.callToAction.text && (
            <span style={{ fontFamily: theme.fonts.mono, fontSize: '12px', color: theme.colors.textMuted }}>
              {props.callToAction.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
