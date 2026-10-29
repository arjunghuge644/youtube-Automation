import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { FlowchartProps } from '@creatorflow/shared';

export const FlowchartScene: React.FC<{ props: FlowchartProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const getNodeColor = (status: string, type: string) => {
    if (status === 'active') return theme.colors.accentYellow;
    if (status === 'success') return theme.colors.accentEmerald;
    if (status === 'error') return theme.colors.accentCoral;
    if (type === 'decision') return '#F59E0B';
    if (type === 'database') return '#A78BFA';
    return theme.colors.accentCyan;
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
      {/* Scene Header */}
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
            color: theme.colors.accentCyan,
            textTransform: 'uppercase',
          }}
        >
          {props.title}
        </span>
        {props.subtitle && (
          <span
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '24px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {props.subtitle}
          </span>
        )}
      </div>

      {/* Flow Nodes Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          width: '100%',
        }}
      >
        {props.nodes.map((node, idx) => {
          const nodeEntrance = spring({
            frame: frame - (idx * 10 + 10),
            fps,
            config: theme.springs.snappy,
          });

          const isActive = props.activeNodeId === node.id || node.status === 'active';
          const nodeColor = getNodeColor(node.status, node.type);
          const pulse = isActive ? Math.sin(frame * 0.15) * 4 : 0;

          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  background: isActive
                    ? 'rgba(255, 209, 102, 0.12)'
                    : theme.colors.cardBgSolid,
                  border: `2px solid ${isActive ? theme.colors.accentYellow : theme.colors.cardBorder}`,
                  borderRadius: node.type === 'decision' ? '28px' : '16px',
                  boxShadow: isActive
                    ? `0 0 25px ${theme.colors.accentYellowGlow}`
                    : '0 8px 24px rgba(0, 0, 0, 0.4)',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  opacity: nodeEntrance,
                  transform: `translateY(${interpolate(nodeEntrance, [0, 1], [25, 0])}px) scale(${1 + pulse * 0.01})`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: node.type === 'decision' ? '50%' : '10px',
                      background: `rgba(255, 255, 255, 0.05)`,
                      border: `1.5px solid ${nodeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: theme.fonts.mono,
                      fontSize: '15px',
                      fontWeight: 800,
                      color: nodeColor,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: '22px',
                        fontWeight: 700,
                        color: theme.colors.textPrimary,
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {node.label}
                    </span>
                    {node.sublabel && (
                      <span
                        style={{
                          fontFamily: theme.fonts.mono,
                          fontSize: '13px',
                          color: theme.colors.textMuted,
                        }}
                      >
                        {node.sublabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type/Status Pill */}
                <div
                  style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: `${nodeColor}22`,
                    border: `1px solid ${nodeColor}66`,
                    fontFamily: theme.fonts.mono,
                    fontSize: '11px',
                    fontWeight: 700,
                    color: nodeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {node.type}
                </div>
              </div>

              {/* Connecting Downward Arrow */}
              {idx < props.nodes.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    opacity: interpolate(
                      frame,
                      [idx * 10 + 16, idx * 10 + 26],
                      [0, 1],
                      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                    ),
                  }}
                >
                  <div
                    style={{
                      width: '2px',
                      height: '16px',
                      background: `linear-gradient(to bottom, ${theme.colors.accentCyan}, ${theme.colors.cardBorder})`,
                    }}
                  />
                  <div
                    style={{
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: `6px solid ${theme.colors.accentCyan}`,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Summary Badge */}
      {props.summaryBadge && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 22px',
            borderRadius: '999px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: `1.5px solid ${theme.colors.accentCyan}`,
            fontFamily: theme.fonts.mono,
            fontSize: '14px',
            fontWeight: 700,
            color: theme.colors.accentCyan,
            letterSpacing: '1px',
            boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)',
            opacity: spring({ frame: frame - 45, fps, config: theme.springs.gentle }),
          }}
        >
          {props.summaryBadge.text}
        </div>
      )}
    </div>
  );
};
