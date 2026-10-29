import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { CacheLayerProps } from '@creatorflow/shared';

export const CacheLayerScene: React.FC<{ props: CacheLayerProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Load bar calculation: starts high, eases down if cache is active
  const isCacheActive = frame > 35;
  const loadBarProgress = interpolate(
    frame,
    [10, 30, 45, 65],
    [30, props.database.loadPercentage, props.database.loadPercentage, isCacheActive ? 28 : props.database.loadPercentage],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Cache card entrance
  const cacheEntrance = spring({
    frame: frame - 20,
    fps,
    config: theme.springs.snappy,
  });

  // Client request particles
  const particleSeeds = [
    { x: 140, yOffset: 0, speed: 2.8 },
    { x: 230, yOffset: 12, speed: 3.2 },
    { x: 320, yOffset: 6, speed: 2.6 },
    { x: 410, yOffset: 18, speed: 3.5 },
    { x: 500, yOffset: 8, speed: 2.9 },
    { x: 580, yOffset: 14, speed: 3.1 },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 44px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '24px',
        position: 'relative',
      }}
    >
      {/* Client Devices Grid (Phone icons) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {[0, 1].map((row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              gap: '14px',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {Array.from({ length: 9 }).map((_, col) => {
              const deviceIndex = row * 9 + col;
              const isActive = deviceIndex < props.clientGrid.activeCount;
              const pulse = Math.sin((frame + deviceIndex * 4) * 0.2) > 0;

              return (
                <div
                  key={col}
                  style={{
                    width: '32px',
                    height: '52px',
                    borderRadius: '7px',
                    border: `1.5px solid ${isActive ? 'rgba(255, 209, 102, 0.7)' : theme.colors.cardBorder}`,
                    backgroundColor: theme.colors.cardBgSolid,
                    padding: '4px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isActive && pulse ? `0 0 8px ${theme.colors.accentYellowGlow}` : 'none',
                  }}
                >
                  {/* Top indicator notch */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '2px',
                      backgroundColor: isActive ? theme.colors.accentYellow : theme.colors.textSubtle,
                    }}
                  />
                  {/* Screen lines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ width: '80%', height: '2px', backgroundColor: theme.colors.textSubtle }} />
                    <div style={{ width: '60%', height: '2px', backgroundColor: theme.colors.textSubtle }} />
                    <div style={{ width: '90%', height: '2px', backgroundColor: theme.colors.textSubtle }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Flow Particles Streaming Downwards */}
      <div
        style={{
          width: '100%',
          height: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {particleSeeds.map((pt, i) => {
          const y = ((frame * pt.speed + pt.yOffset * 10) % 70) - 10;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pt.x}px`,
                top: `${y}px`,
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: theme.colors.textPrimary,
                boxShadow: '0 0 8px #ffffff',
                opacity: y > 0 && y < 55 ? 0.9 : 0,
              }}
            />
          );
        })}
      </div>

      {/* Cache Card (Redis) */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${isCacheActive ? theme.colors.accentCyan : theme.colors.cardBorder}`,
          borderRadius: '20px',
          padding: '24px 30px',
          boxSizing: 'border-box',
          opacity: cacheEntrance,
          transform: `scale(${interpolate(cacheEntrance, [0, 1], [0.95, 1])})`,
          boxShadow: isCacheActive ? '0 0 24px rgba(56, 189, 248, 0.25)' : 'none',
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '2px',
            color: theme.colors.accentYellow,
            marginBottom: '18px',
          }}
        >
          {props.cache.name}
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Hit / Miss Box */}
          <div
            style={{
              flex: 1,
              border: `1.5px dashed ${theme.colors.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              fontFamily: theme.fonts.mono,
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: isCacheActive ? theme.colors.accentEmerald : theme.colors.textMuted,
            }}
          >
            {isCacheActive ? 'HIT' : props.cache.status}
          </div>

          {/* TTL Digital Counter */}
          <div
            style={{
              flex: 1,
              border: `1.5px solid ${theme.colors.cardBorder}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              fontFamily: theme.fonts.mono,
              fontSize: '20px',
              fontWeight: 800,
              color: theme.colors.textPrimary,
              letterSpacing: '2px',
            }}
          >
            <span style={{ color: theme.colors.textMuted, fontSize: '15px' }}>TTL </span>
            {props.cache.ttl}
          </div>
        </div>
      </div>

      {/* Invalidation Pill Badge */}
      <div
        style={{
          border: `1.5px solid ${theme.colors.accentYellow}`,
          borderRadius: '8px',
          padding: '6px 16px',
          fontFamily: theme.fonts.mono,
          fontSize: '15px',
          fontWeight: 800,
          letterSpacing: '2px',
          color: theme.colors.accentYellow,
          backgroundColor: theme.colors.cardBgSolid,
          boxShadow: `0 0 10px ${theme.colors.accentYellowGlow}`,
        }}
      >
        {props.transferBadge}
      </div>

      {/* Database Container (Postgres) */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${loadBarProgress > 60 ? theme.colors.accentYellow : theme.colors.cardBorder}`,
          borderRadius: '24px',
          padding: '28px 32px',
          boxSizing: 'border-box',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* DB Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          <svg width="32" height="38" viewBox="0 0 40 48" fill="none">
            <ellipse cx="20" cy="12" rx="18" ry="8" stroke={theme.colors.accentYellow} strokeWidth="2.5" />
            <path
              d="M2 12 V 36 C 2 40.4 10.05 44 20 44 C 29.95 44 38 40.4 38 36 V 12"
              stroke={theme.colors.accentYellow}
              strokeWidth="2.5"
            />
          </svg>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: theme.colors.accentYellow,
            }}
          >
            {props.database.name.toUpperCase()}
          </div>
        </div>

        {/* Content Row: Operations & Menu item card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
          {/* Operations List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontFamily: theme.fonts.mono,
              fontSize: '16px',
              color: theme.colors.textMuted,
            }}
          >
            {props.database.operations.map((op, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: theme.colors.accentYellow }}>↺</span>
                <span>{op}</span>
              </div>
            ))}
          </div>

          {/* Menu item with strikethrough price */}
          {props.database.updatedItem && (
            <div
              style={{
                border: `1.5px solid ${theme.colors.cardBorder}`,
                borderRadius: '14px',
                padding: '14px 20px',
                backgroundColor: theme.colors.cardBgSolid,
                minWidth: '150px',
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '13px',
                  letterSpacing: '1.5px',
                  color: theme.colors.textMuted,
                  marginBottom: '6px',
                }}
              >
                {props.database.updatedItem.label}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.sans,
                  fontSize: '22px',
                  fontWeight: 800,
                  color: theme.colors.textPrimary,
                  marginBottom: '6px',
                }}
              >
                {props.database.updatedItem.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: theme.fonts.sans }}>
                <span
                  style={{
                    fontSize: '18px',
                    textDecoration: 'line-through',
                    color: theme.colors.textMuted,
                  }}
                >
                  {props.database.updatedItem.oldValue}
                </span>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: theme.colors.accentYellow,
                  }}
                >
                  {props.database.updatedItem.newValue}
                </span>
                <span style={{ fontSize: '14px', color: theme.colors.accentYellow }}>✏️</span>
              </div>
            </div>
          )}
        </div>

        {/* Load Progress Bar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: theme.fonts.mono,
              fontSize: '14px',
              letterSpacing: '2px',
              color: theme.colors.textMuted,
              marginBottom: '8px',
              fontWeight: 600,
            }}
          >
            <span>LOAD</span>
            <span>{Math.round(loadBarProgress)}%</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '7px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${loadBarProgress}%`,
                height: '100%',
                backgroundColor: loadBarProgress > 60 ? theme.colors.accentYellow : theme.colors.accentEmerald,
                borderRadius: '7px',
                boxShadow:
                  loadBarProgress > 60
                    ? `0 0 12px ${theme.colors.accentYellowGlow}`
                    : '0 0 12px rgba(16, 185, 129, 0.4)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
