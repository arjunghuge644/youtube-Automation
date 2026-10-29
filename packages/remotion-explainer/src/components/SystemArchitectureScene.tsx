import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { SystemArchitectureProps } from '@creatorflow/shared';

export const SystemArchitectureScene: React.FC<{ props: SystemArchitectureProps }> = ({
  props,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Dynamic milestones scaled to narration duration
  const rootEntranceFrame = Math.max(4, Math.floor(durationInFrames * 0.05));
  const linesStartFrame = Math.floor(durationInFrames * 0.14);
  const linesEndFrame = Math.floor(durationInFrames * 0.34);
  const branchEntranceFrame = Math.floor(durationInFrames * 0.32);
  const statusNotesStart = Math.floor(durationInFrames * 0.48);
  const punchlineFrame = Math.floor(durationInFrames * 0.70);

  // Root node entrance
  const rootEntrance = spring({
    frame: frame - rootEntranceFrame,
    fps,
    config: theme.springs.snappy,
  });

  // Circuit connectors draw progress
  const linesProgress = interpolate(frame, [linesStartFrame, linesEndFrame], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Leaf branches entrance
  const branchEntrance = spring({
    frame: frame - branchEntranceFrame,
    fps,
    config: theme.springs.gentle,
  });

  // Punchline entrance
  const punchlineEntrance = spring({
    frame: frame - punchlineFrame,
    fps,
    config: theme.springs.snappy,
  });

  // Accent colors for branches
  const branchAccents = [theme.colors.accentEmerald, theme.colors.accentCyan, theme.colors.accentYellow];

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
      {/* Top Status Notes */}
      {props.statusNotes && props.statusNotes.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            width: '100%',
            paddingLeft: '12px',
          }}
        >
          {props.statusNotes.map((note, idx) => {
            const noteFrame = statusNotesStart + idx * 16;
            const noteEntrance = spring({
              frame: frame - noteFrame,
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
                  fontSize: '36px',
                  fontWeight: 800,
                  color: isCheck ? theme.colors.textPrimary : theme.colors.accentCoral,
                  opacity: noteEntrance,
                  transform: `translateX(${interpolate(noteEntrance, [0, 1], [-24, 0])}px)`,
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: `2.5px solid ${iconColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    color: iconColor,
                    boxShadow: `0 0 14px ${iconColor}66`,
                    flexShrink: 0,
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
          width: '380px',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.accentYellow}`,
          borderRadius: '22px',
          padding: '28px 24px 22px 24px',
          textAlign: 'center',
          boxSizing: 'border-box',
          opacity: rootEntrance,
          transform: `scale(${interpolate(rootEntrance, [0, 1], [0.92, 1])})`,
          boxShadow: `0 0 32px ${theme.colors.accentYellowGlow}`,
          marginTop: '12px',
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
            padding: '6px 18px',
            borderRadius: '20px',
            boxShadow: `0 0 14px ${theme.colors.accentYellowGlow}`,
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
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {props.sourceOfTruth.type}
        </div>
        <div
          style={{
            fontFamily: theme.fonts.sans,
            fontSize: '38px',
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
            color: theme.colors.accentYellow,
            fontWeight: 600,
          }}
        >
          {props.sourceOfTruth.details}
        </div>
      </div>

      {/* Circuit Branching Lines */}
      <div style={{ width: '100%', height: '64px', position: 'relative' }}>
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
            y2="32"
            stroke={theme.colors.accentYellow}
            strokeWidth="2.5"
          />

          {/* Horizontal branching rail */}
          <line
            x1="18%"
            y1="32"
            x2="82%"
            y2="32"
            stroke={theme.colors.cardBorder}
            strokeWidth="2.5"
            strokeDasharray="260"
            strokeDashoffset={`${260 - (linesProgress / 100) * 260}`}
          />

          {/* Drops to 3 leaf nodes */}
          <line x1="18%" y1="32" x2="18%" y2="64" stroke={theme.colors.cardBorder} strokeWidth="2.5" />
          <line x1="50%" y1="32" x2="50%" y2="64" stroke={theme.colors.cardBorder} strokeWidth="2.5" />
          <line x1="82%" y1="32" x2="82%" y2="64" stroke={theme.colors.cardBorder} strokeWidth="2.5" />

          {/* Animated pulsing data packets */}
          {linesProgress > 40 && (
            <>
              <circle
                cx="18%"
                cy={`${32 + ((frame * 2.5) % 32)}`}
                r="4"
                fill={theme.colors.accentEmerald}
              />
              <circle
                cx="50%"
                cy={`${32 + ((frame * 2.8) % 32)}`}
                r="4"
                fill={theme.colors.accentCyan}
              />
              <circle
                cx="82%"
                cy={`${32 + ((frame * 3.1) % 32)}`}
                r="4"
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
        {props.branches.map((b, idx) => {
          const accent = branchAccents[idx % branchAccents.length];
          return (
            <div
              key={idx}
              style={{
                backgroundColor: theme.colors.cardBg,
                border: `2px solid ${accent}`,
                borderRadius: '18px',
                padding: '20px 12px',
                textAlign: 'center',
                boxSizing: 'border-box',
                boxShadow: `0 8px 24px ${accent}22`,
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '18px',
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
                  fontSize: '14px',
                  color: accent,
                  fontWeight: 600,
                }}
              >
                {b.subtitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Punchline Banner */}
      {props.punchline && (
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontFamily: theme.fonts.sans,
            fontSize: '34px',
            fontWeight: 800,
            lineHeight: 1.3,
            color: theme.colors.textPrimary,
            backgroundColor: 'rgba(255, 209, 102, 0.08)',
            border: `1.5px solid rgba(255, 209, 102, 0.3)`,
            borderRadius: '18px',
            padding: '18px 28px',
            width: '100%',
            boxSizing: 'border-box',
            opacity: punchlineEntrance,
            transform: `scale(${interpolate(punchlineEntrance, [0, 1], [0.94, 1])})`,
          }}
        >
          {props.punchline.highlightWord && props.punchline.text.includes(props.punchline.highlightWord) ? (
            <>
              <span>{props.punchline.text.substring(0, props.punchline.text.indexOf(props.punchline.highlightWord))}</span>
              <span
                style={{
                  color: theme.colors.accentYellow,
                  fontWeight: 800,
                  textShadow: `0 0 16px ${theme.colors.accentYellowGlow}`,
                }}
              >
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
