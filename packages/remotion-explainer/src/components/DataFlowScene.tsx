import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { DataFlowProps } from '@creatorflow/shared';

export const DataFlowScene: React.FC<{ props: DataFlowProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleEntrance = spring({
    frame: frame - 4,
    fps,
    config: theme.springs.snappy,
  });

  const getStageColor = (type: string) => {
    switch (type) {
      case 'source':
        return theme.colors.accentCyan;
      case 'queue':
        return theme.colors.accentYellow;
      case 'processor':
        return '#A78BFA';
      case 'storage':
        return theme.colors.accentEmerald;
      case 'client':
        return '#F43F5E';
      default:
        return theme.colors.accentCyan;
    }
  };

  // Packet looping animation position (0 to 100%)
  const packetPos = (frame * 2.5) % 100;

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
            color: theme.colors.accentCyan,
            textTransform: 'uppercase',
          }}
        >
          {props.title}
        </span>
      </div>

      {/* Pipeline Stages Vertical Stack */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          maxWidth: '560px',
          position: 'relative',
        }}
      >
        {props.stages.map((stage, idx) => {
          const stageEntrance = spring({
            frame: frame - (idx * 10 + 8),
            fps,
            config: theme.springs.snappy,
          });

          const stageColor = getStageColor(stage.type);

          return (
            <React.Fragment key={stage.id}>
              {/* Stage Card */}
              <div
                style={{
                  width: '100%',
                  background: theme.colors.cardBgSolid,
                  border: `2px solid ${stageColor}`,
                  borderRadius: '14px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: `0 4px 20px ${stageColor}22`,
                  opacity: stageEntrance,
                  transform: `translateY(${interpolate(stageEntrance, [0, 1], [20, 0])}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `${stageColor}22`,
                      border: `1.5px solid ${stageColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: theme.fonts.mono,
                      fontSize: '13px',
                      fontWeight: 800,
                      color: stageColor,
                    }}
                  >
                    0{idx + 1}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span
                      style={{
                        fontFamily: theme.fonts.sans,
                        fontSize: '18px',
                        fontWeight: 800,
                        color: theme.colors.textPrimary,
                      }}
                    >
                      {stage.name}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: '11px',
                        color: theme.colors.textMuted,
                        textTransform: 'uppercase',
                      }}
                    >
                      {stage.type}
                    </span>
                  </div>
                </div>

                {stage.throughput && (
                  <span
                    style={{
                      fontFamily: theme.fonts.mono,
                      fontSize: '12px',
                      fontWeight: 700,
                      color: theme.colors.accentEmerald,
                      background: 'rgba(16, 185, 129, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.colors.accentEmerald}44`,
                    }}
                  >
                    {stage.throughput}
                  </span>
                )}
              </div>

              {/* Streaming Conduit */}
              {idx < props.stages.length - 1 && (
                <div
                  style={{
                    position: 'relative',
                    width: '4px',
                    height: '24px',
                    background: 'rgba(92, 131, 195, 0.3)',
                    borderRadius: '2px',
                  }}
                >
                  {/* Moving Data Packet Dot */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${packetPos}%`,
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: theme.colors.accentYellow,
                      boxShadow: `0 0 10px ${theme.colors.accentYellowGlow}`,
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Metrics Row */}
      {props.metrics && props.metrics.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            maxWidth: '560px',
            justifyContent: 'center',
          }}
        >
          {props.metrics.map((metric, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${theme.colors.cardBorder}`,
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '11px', color: theme.colors.textMuted }}>
                {metric.label}
              </span>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '16px', fontWeight: 800, color: theme.colors.accentCyan }}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Alert if present */}
      {props.alert && (
        <div
          style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: `1.5px solid ${theme.colors.accentCoral}`,
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ color: theme.colors.accentCoral, fontWeight: 900, fontSize: '16px' }}>▲</span>
          <span style={{ fontFamily: theme.fonts.sans, fontSize: '13px', fontWeight: 700, color: theme.colors.textPrimary }}>
            {props.alert.message}
          </span>
        </div>
      )}
    </div>
  );
};

