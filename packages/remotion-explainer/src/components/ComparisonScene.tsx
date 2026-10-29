import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { ComparisonProps } from '@creatorflow/shared';

export const ComparisonScene: React.FC<{ props: ComparisonProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const vsEntrance = spring({
    frame: frame - 16,
    fps,
    config: theme.springs.bouncy,
  });

  const leftEntrance = spring({
    frame: frame - 10,
    fps,
    config: theme.springs.snappy,
  });

  const rightEntrance = spring({
    frame: frame - 18,
    fps,
    config: theme.springs.snappy,
  });

  const verdictEntrance = spring({
    frame: frame - 40,
    fps,
    config: theme.springs.gentle,
  });

  const renderIcon = (iconType: string, accentColor: string) => {
    switch (iconType) {
      case 'check':
        return (
          <span style={{ color: theme.colors.accentEmerald, fontWeight: 900, fontSize: '18px' }}>
            ✓
          </span>
        );
      case 'cross':
        return (
          <span style={{ color: theme.colors.accentCoral, fontWeight: 900, fontSize: '18px' }}>
            ✕
          </span>
        );
      case 'warning':
        return (
          <span style={{ color: theme.colors.accentYellow, fontWeight: 900, fontSize: '18px' }}>
            ▲
          </span>
        );
      default:
        return (
          <span style={{ color: accentColor, fontWeight: 900, fontSize: '18px' }}>
            ●
          </span>
        );
    }
  };

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
      {/* Title */}
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
            fontFamily: theme.fonts.mono,
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '2.5px',
            color: theme.colors.accentYellow,
            textTransform: 'uppercase',
          }}
        >
          {props.title}
        </span>
      </div>

      {/* Side-by-side or stacked comparative container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: '14px',
          width: '100%',
          position: 'relative',
        }}
      >
        {/* Left Side */}
        <div
          style={{
            flex: 1,
            background: 'rgba(13, 27, 58, 0.95)',
            border: `2px solid ${props.leftSide.accentColor || theme.colors.accentCyan}`,
            borderRadius: '16px',
            padding: '18px 14px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: `0 8px 30px ${props.leftSide.accentColor}22`,
            opacity: leftEntrance,
            transform: `translateX(${interpolate(leftEntrance, [0, 1], [-25, 0])}px)`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: '22px',
                fontWeight: 800,
                color: props.leftSide.accentColor || theme.colors.accentCyan,
              }}
            >
              {props.leftSide.title}
            </span>
            {props.leftSide.subtitle && (
              <span
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '12px',
                  color: theme.colors.textMuted,
                }}
              >
                {props.leftSide.subtitle}
              </span>
            )}
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {props.leftSide.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.cardBorder}`,
                }}
              >
                {renderIcon(item.icon, props.leftSide.accentColor || theme.colors.accentCyan)}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '14px',
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {item.title}
                  </span>
                  {item.description && (
                    <span
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: '11px',
                        color: theme.colors.textSecondary,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VS Badge in Center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${vsEntrance})`,
            zIndex: 10,
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: theme.colors.accentYellow,
            color: '#080F22',
            fontFamily: theme.fonts.mono,
            fontWeight: 900,
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${theme.colors.accentYellowGlow}`,
            border: '3px solid #080F22',
          }}
        >
          {props.versusLabel || 'VS'}
        </div>

        {/* Right Side */}
        <div
          style={{
            flex: 1,
            background: 'rgba(13, 27, 58, 0.95)',
            border: `2px solid ${props.rightSide.accentColor || theme.colors.accentCoral}`,
            borderRadius: '16px',
            padding: '18px 14px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: `0 8px 30px ${props.rightSide.accentColor}22`,
            opacity: rightEntrance,
            transform: `translateX(${interpolate(rightEntrance, [0, 1], [25, 0])}px)`,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: '22px',
                fontWeight: 800,
                color: props.rightSide.accentColor || theme.colors.accentCoral,
              }}
            >
              {props.rightSide.title}
            </span>
            {props.rightSide.subtitle && (
              <span
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '12px',
                  color: theme.colors.textMuted,
                }}
              >
                {props.rightSide.subtitle}
              </span>
            )}
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {props.rightSide.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.cardBorder}`,
                }}
              >
                {renderIcon(item.icon, props.rightSide.accentColor || theme.colors.accentCoral)}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontFamily: theme.fonts.sans,
                      fontSize: '14px',
                      fontWeight: 700,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {item.title}
                  </span>
                  {item.description && (
                    <span
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: '11px',
                        color: theme.colors.textSecondary,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verdict / Conclusion Banner */}
      {props.verdict && (
        <div
          style={{
            width: '100%',
            maxWidth: '580px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.15))',
            border: `2px solid ${theme.colors.accentEmerald}`,
            borderRadius: '14px',
            padding: '14px 20px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
            opacity: verdictEntrance,
            transform: `translateY(${interpolate(verdictEntrance, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              background: theme.colors.accentEmerald,
              color: '#080F22',
              fontFamily: theme.fonts.mono,
              fontWeight: 900,
              fontSize: '11px',
              letterSpacing: '1px',
            }}
          >
            VERDICT
          </div>
          <span
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '15px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
              lineHeight: 1.4,
            }}
          >
            {props.verdict.text}
          </span>
        </div>
      )}
    </div>
  );
};
