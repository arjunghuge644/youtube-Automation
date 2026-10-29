import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { NetworkDiagramProps } from '@creatorflow/shared';

export const NetworkDiagramScene: React.FC<{ props: NetworkDiagramProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const centralEntrance = spring({
    frame: frame - 10,
    fps,
    config: theme.springs.bouncy,
  });

  // Animated radio pulse wave from central hub
  const waveRadius = (frame * 1.8) % 70;
  const waveOpacity = interpolate(waveRadius, [0, 70], [0.8, 0]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 32px',
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
        <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
          TOPOLOGY · {props.topology.toUpperCase()}
        </span>
      </div>

      {/* Central Hub Coordinator */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          background: 'rgba(13, 27, 58, 0.95)',
          border: `2px solid ${theme.colors.accentYellow}`,
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: `0 0 30px ${theme.colors.accentYellowGlow}`,
          opacity: centralEntrance,
          transform: `scale(${interpolate(centralEntrance, [0, 1], [0.92, 1])})`,
        }}
      >
        {/* Pulse wave ring */}
        <div
          style={{
            position: 'absolute',
            left: '32px',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${waveRadius * 2}px`,
            height: `${waveRadius * 2}px`,
            borderRadius: '50%',
            border: `2px solid ${theme.colors.accentYellow}`,
            opacity: waveOpacity,
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: theme.colors.accentYellow,
              color: '#080F22',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: theme.fonts.mono,
              fontWeight: 900,
              fontSize: '18px',
            }}
          >
            ★
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontFamily: theme.fonts.sans, fontSize: '19px', fontWeight: 800, color: theme.colors.textPrimary }}>
              {props.centralNode.label}
            </span>
            <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
              {props.centralNode.role}
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 209, 102, 0.15)',
            border: `1px solid ${theme.colors.accentYellow}`,
            fontFamily: theme.fonts.mono,
            fontSize: '11px',
            fontWeight: 800,
            color: theme.colors.accentYellow,
            textTransform: 'uppercase',
          }}
        >
          {props.centralNode.status || 'ACTIVE'}
        </div>
      </div>

      {/* Peripheral Cluster Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '560px',
        }}
      >
        {props.peripheralNodes.map((node, idx) => {
          const nodeEntrance = spring({
            frame: frame - (idx * 8 + 18),
            fps,
            config: theme.springs.snappy,
          });

          const isHealthy = node.status !== 'degraded' && node.status !== 'offline';
          const nodeColor = isHealthy ? theme.colors.accentCyan : theme.colors.accentCoral;

          return (
            <div
              key={node.id}
              style={{
                background: theme.colors.cardBgSolid,
                border: `1.5px solid ${theme.colors.cardBorder}`,
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                opacity: nodeEntrance,
                transform: `translateY(${interpolate(nodeEntrance, [0, 1], [15, 0])}px)`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: theme.fonts.sans, fontSize: '15px', fontWeight: 700, color: theme.colors.textPrimary }}>
                  {node.label}
                </span>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: nodeColor,
                    boxShadow: `0 0 8px ${nodeColor}`,
                  }}
                />
              </div>

              {node.role && (
                <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
                  {node.role}
                </span>
              )}

              {node.latencyMs !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: '10px', color: theme.colors.textSecondary }}>
                    RTT:
                  </span>
                  <span style={{ fontFamily: theme.fonts.mono, fontSize: '12px', fontWeight: 800, color: theme.colors.accentEmerald }}>
                    {node.latencyMs}ms
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Network Metrics Footer */}
      {(props.bandwidthMetric || props.securityBadge) && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            maxWidth: '560px',
            justifyContent: 'center',
          }}
        >
          {props.bandwidthMetric && (
            <div
              style={{
                flex: 1,
                background: 'rgba(56, 189, 248, 0.1)',
                border: `1px solid ${theme.colors.accentCyan}`,
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
                THROUGHPUT:
              </span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '13px', fontWeight: 800, color: theme.colors.accentCyan }}>
                {props.bandwidthMetric}
              </span>
            </div>
          )}

          {props.securityBadge && (
            <div
              style={{
                flex: 1,
                background: 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${theme.colors.accentEmerald}`,
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: theme.colors.accentEmerald, fontWeight: 900 }}>🔒</span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '12px', fontWeight: 800, color: theme.colors.accentEmerald }}>
                {props.securityBadge}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
