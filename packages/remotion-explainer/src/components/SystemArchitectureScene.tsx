import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SystemArchitectureProps } from '@creatorflow/shared';

export const SystemArchitectureScene: React.FC<{ props: SystemArchitectureProps }> = ({
  props,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Root node entrance
  const rootEntrance = spring({
    frame: frame - 10,
    fps,
    config: theme.springs.snappy,
  });

  // Circuit connectors draw progress
  const linesProgress = interpolate(frame, [22, 38], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Leaf branches entrance
  const branchEntrance = spring({
    frame: frame - 35,
    fps,
    config: theme.springs.gentle,
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
      }}
    >
      {/* Top Status Notes */}
      {props.statusNotes && props.statusNotes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            paddingLeft: '16px',
          }}
        >
          {props.statusNotes.map((note, idx) => {
            const noteEntrance = spring({
              frame: frame - (idx * 14 + 5),
              fps,
              config: theme.springs.snappy,
            });

            const isCheck = note.icon === 'check';
            const iconColor = isCheck ? theme.colors.accentEmerald : theme.colors.accentCoral;

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
                  color: isCheck ? theme.colors.textPrimary : theme.colors.accentCoral,
                  opacity: noteEntrance,
                  transform: `translateX(${interpolate(noteEntrance, [0, 1], [-20, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: `2px solid ${iconColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    color: iconColor,
                    boxShadow: `0 0 12px ${iconColor}66`,
                  }}
                >
                  {isCheck ? '✓' : '✕'}
                </div>
                <span>{note.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Central Source-of-Truth Node */}
      <div
        style={{
          position: 'relative',
          width: '320px',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.accentYellow}`,
          borderRadius: '20px',
          padding: '28px 24px 20px 24px',
          textAlign: 'center',
          boxSizing: 'border-box',
          opacity: rootEntrance,
          transform: `scale(${interpolate(rootEntrance, [0, 1], [0.9, 1])})`,
          boxShadow: `0 0 28px ${theme.colors.accentYellowGlow}`,
          marginTop: '16px',
          zIndex: 5,
        }}
      >
        {/* Top Pill Badge */}
        <div
          style={{
            position: 'absolute',
            top: '-16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: theme.colors.accentYellow,
            color: '#000000',
            fontFamily: theme.fonts.mono,
            fontSize: '13px',
            fontWeight: 800,
            letterSpacing: '2px',
            padding: '5px 16px',
            borderRadius: '20px',
            boxShadow: `0 0 12px ${theme.colors.accentYellowGlow}`,
            whiteSpace: 'nowrap',
          }}
        >
          {props.sourceOfTruth.badge}
        </div>

        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '14px',
            letterSpacing: '2px',
            color: theme.colors.textMuted,
            marginBottom: '6px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {props.sourceOfTruth.type}
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '34px',
            fontWeight: 800,
            color: theme.colors.textPrimary,
            letterSpacing: '1px',
            marginBottom: '6px',
          }}
        >
          {props.sourceOfTruth.name}
        </div>
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '16px',
            color: theme.colors.textMuted,
          }}
        >
          {props.sourceOfTruth.details}
        </div>
      </div>

      {/* Circuit Branching Lines */}
      <div style={{ width: '100%', height: '70px', position: 'relative' }}>
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
        >
          {/* Main vertical line from center */}
          <line
            x1="50%"
            y1="0"
            x2="50%"
            y2="35"
            stroke={theme.colors.cardBorder}
            strokeWidth="2"
          />

          {/* Horizontal branching rail */}
          <line
            x1="18%"
            y1="35"
            x2="82%"
            y2="35"
            stroke={theme.colors.cardBorder}
            strokeWidth="2"
            strokeDasharray="200"
            strokeDashoffset={`${200 - (linesProgress / 100) * 200}`}
          />

          {/* Drops to 3 leaf nodes */}
          <line x1="18%" y1="35" x2="18%" y2="70" stroke={theme.colors.cardBorder} strokeWidth="2" />
          <line x1="50%" y1="35" x2="50%" y2="70" stroke={theme.colors.cardBorder} strokeWidth="2" />
          <line x1="82%" y1="35" x2="82%" y2="70" stroke={theme.colors.cardBorder} strokeWidth="2" />

          {/* Animated pulsing data packets */}
          {linesProgress > 50 && (
            <>
              <circle
                cx="18%"
                cy={`${35 + ((frame * 2) % 35)}`}
                r="3.5"
                fill={theme.colors.accentYellow}
              />
              <circle
                cx="50%"
                cy={`${35 + ((frame * 2.2) % 35)}`}
                r="3.5"
                fill={theme.colors.accentYellow}
              />
              <circle
                cx="82%"
                cy={`${35 + ((frame * 2.5) % 35)}`}
                r="3.5"
                fill={theme.colors.accentYellow}
              />
            </>
          )}
        </svg>
      </div>

      {/* Leaf Branch Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          width: '100%',
          opacity: branchEntrance,
          transform: `translateY(${interpolate(branchEntrance, [0, 1], [20, 0])}px)`,
        }}
      >
        {props.branches.map((b, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: theme.colors.cardBg,
              border: `1.5px solid ${theme.colors.cardBorder}`,
              borderRadius: '16px',
              padding: '18px 12px',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '16px',
                fontWeight: 800,
                color: theme.colors.textPrimary,
                marginBottom: '6px',
                letterSpacing: '1px',
              }}
            >
              {b.title}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '13px',
                color: theme.colors.textMuted,
              }}
            >
              {b.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Punchline Statement */}
      {props.punchline && (
        <div
          style={{
            marginTop: '28px',
            textAlign: 'center',
            fontFamily: theme.fonts.sans,
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: 1.3,
            color: theme.colors.textSecondary,
          }}
        >
          {props.punchline.highlightWord && props.punchline.text.includes(props.punchline.highlightWord) ? (
            <>
              <span>{props.punchline.text.substring(0, props.punchline.text.indexOf(props.punchline.highlightWord))}</span>
              <span style={{ color: theme.colors.accentYellow, fontWeight: 800 }}>
                {props.punchline.highlightWord}
              </span>
              <span>
                {props.punchline.text.substring(
                  props.punchline.text.indexOf(props.punchline.highlightWord) +
                    props.punchline.highlightWord.length
                )}
              </span>
            </>
          ) : (
            <span>{props.punchline.text}</span>
          )}
        </div>
      )}
    </div>
  );
};
