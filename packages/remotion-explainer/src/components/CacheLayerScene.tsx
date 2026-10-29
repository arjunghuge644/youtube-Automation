import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { CacheLayerProps } from '@creatorflow/shared';

export const CacheLayerScene: React.FC<{ props: CacheLayerProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Load bar calculation: dynamically timed with scene duration
  const cacheActivateFrame = Math.round(durationInFrames * 0.42);
  const isCacheActive = frame >= cacheActivateFrame;

  const loadBarProgress = interpolate(
    frame,
    [0, cacheActivateFrame - 10, cacheActivateFrame, cacheActivateFrame + 25],
    [30, props.database.loadPercentage, props.database.loadPercentage, isCacheActive ? 22 : props.database.loadPercentage],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Cache card entrance
  const cacheEntrance = spring({
    frame: frame - Math.round(durationInFrames * 0.15),
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
        padding: '0 24px',
        width: '100%',
        maxWidth: '640px',
        boxSizing: 'border-box',
        gap: '20px',
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
        <div
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: '15px',
            letterSpacing: '2.5px',
            color: theme.colors.textMuted,
            fontWeight: 800,
            textTransform: 'uppercase',
          }}
        >
          PEAK DINNER RUSH · CONCURRENT CLIENTS
        </div>

        {[0, 1].map((row) => (
          <div
            key={row}
            style={{
              display: 'flex',
              gap: '16px',
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
                    width: '36px',
                    height: '56px',
                    borderRadius: '8px',
                    border: `2px solid ${isActive ? theme.colors.accentYellow : theme.colors.cardBorder}`,
                    backgroundColor: theme.colors.cardBgSolid,
                    padding: '5px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isActive && pulse ? `0 0 10px ${theme.colors.accentYellowGlow}` : 'none',
                  }}
                >
                  {/* Top indicator notch */}
                  <div
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: isActive ? theme.colors.accentYellow : theme.colors.textSubtle,
                    }}
                  />
                  {/* Screen lines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ width: '80%', height: '3px', backgroundColor: theme.colors.textSubtle }} />
                    <div style={{ width: '60%', height: '3px', backgroundColor: theme.colors.textSubtle }} />
                    <div style={{ width: '90%', height: '3px', backgroundColor: theme.colors.textSubtle }} />
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
          height: '46px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {particleSeeds.map((pt, i) => {
          const y = ((frame * pt.speed + pt.yOffset * 10) % 60) - 10;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${pt.x}px`,
                top: `${y}px`,
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: theme.colors.accentYellow,
                boxShadow: `0 0 10px ${theme.colors.accentYellowGlow}`,
                opacity: y > 0 && y < 50 ? 0.95 : 0,
              }}
            />
          );
        })}
      </div>

      {/* Cache Card (Redis) */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBgSolid,
          border: `2px solid ${isCacheActive ? theme.colors.accentEmerald : theme.colors.cardBorder}`,
          borderRadius: '20px',
          padding: '24px 30px',
          boxSizing: 'border-box',
          opacity: cacheEntrance,
          transform: `scale(${interpolate(cacheEntrance, [0, 1], [0.95, 1])})`,
          boxShadow: isCacheActive ? '0 0 30px rgba(16, 185, 129, 0.3)' : '0 12px 30px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '24px',
              fontWeight: 900,
              letterSpacing: '2px',
              color: theme.colors.accentYellow,
            }}
          >
            {props.cache.name}
          </div>
          <div
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: `1px solid ${theme.colors.accentCyan}`,
              fontFamily: theme.fonts.mono,
              fontSize: '13px',
              fontWeight: 800,
              color: theme.colors.accentCyan,
            }}
          >
            IN-MEMORY RAM
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Hit / Miss Box */}
          <div
            style={{
              flex: 1,
              border: `2px solid ${isCacheActive ? theme.colors.accentEmerald : theme.colors.cardBorder}`,
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center',
              fontFamily: theme.fonts.mono,
              fontSize: '22px',
              fontWeight: 900,
              letterSpacing: '2px',
              backgroundColor: isCacheActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: isCacheActive ? theme.colors.accentEmerald : theme.colors.textMuted,
            }}
          >
            {isCacheActive ? 'HIT · 80% READS' : 'MISS · PASS-THROUGH'}
          </div>

          {/* TTL Digital Counter */}
          <div
            style={{
              flex: 1,
              border: `1.5px solid ${theme.colors.cardBorder}`,
              borderRadius: '14px',
              padding: '16px',
              textAlign: 'center',
              fontFamily: theme.fonts.mono,
              fontSize: '22px',
              fontWeight: 900,
              color: theme.colors.textPrimary,
              letterSpacing: '2px',
            }}
          >
            <span style={{ color: theme.colors.textMuted, fontSize: '15px' }}>TTL </span>
            {props.cache.ttl}
          </div>
        </div>
      </div>

      {/* Database Container (Postgres) */}
      <div
        style={{
          width: '100%',
          backgroundColor: theme.colors.cardBgSolid,
          border: `2px solid ${loadBarProgress > 60 ? theme.colors.accentCoral : theme.colors.cardBorder}`,
          borderRadius: '24px',
          padding: '28px 32px',
          boxSizing: 'border-box',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* DB Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                fontSize: '24px',
                fontWeight: 900,
                letterSpacing: '2px',
                color: theme.colors.accentYellow,
              }}
            >
              {props.database.name.toUpperCase()}
            </div>
          </div>

          <div
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: loadBarProgress > 60 ? 'rgba(255, 92, 92, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${loadBarProgress > 60 ? theme.colors.accentCoral : theme.colors.accentEmerald}`,
              fontFamily: theme.fonts.mono,
              fontSize: '13px',
              fontWeight: 800,
              color: loadBarProgress > 60 ? theme.colors.accentCoral : theme.colors.accentEmerald,
            }}
          >
            {loadBarProgress > 60 ? 'HIGH LOAD' : 'PROTECTED'}
          </div>
        </div>

        {/* Content Row: Operations & Menu item card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '20px' }}>
          {/* Operations List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              fontFamily: theme.fonts.mono,
              fontSize: '17px',
              color: theme.colors.textMuted,
            }}
          >
            {props.database.operations.map((op, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: theme.colors.accentYellow, fontWeight: 900 }}>↺</span>
                <span style={{ color: theme.colors.textPrimary }}>{op}</span>
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
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                minWidth: '160px',
              }}
            >
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: '14px',
                  letterSpacing: '1.5px',
                  color: theme.colors.textMuted,
                  marginBottom: '4px',
                  fontWeight: 700,
                }}
              >
                {props.database.updatedItem.label}
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.sans,
                  fontSize: '24px',
                  fontWeight: 800,
                  color: theme.colors.textPrimary,
                  marginBottom: '4px',
                }}
              >
                {props.database.updatedItem.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: theme.fonts.sans }}>
                <span
                  style={{
                    fontSize: '18px',
                    textDecoration: 'line-through',
                    color: theme.colors.accentCoral,
                  }}
                >
                  {props.database.updatedItem.oldValue}
                </span>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    color: theme.colors.accentEmerald,
                  }}
                >
                  {props.database.updatedItem.newValue}
                </span>
                <span style={{ fontSize: '15px' }}>✓</span>
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
              fontSize: '16px',
              letterSpacing: '2px',
              color: theme.colors.textMuted,
              marginBottom: '8px',
              fontWeight: 700,
            }}
          >
            <span>DATABASE LOAD</span>
            <span style={{ color: loadBarProgress > 60 ? theme.colors.accentCoral : theme.colors.accentEmerald, fontWeight: 900 }}>
              {Math.round(loadBarProgress)}% {loadBarProgress > 60 ? '(CRUSHED)' : '(ABSORBED)'}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${loadBarProgress}%`,
                height: '100%',
                backgroundColor: loadBarProgress > 60 ? theme.colors.accentCoral : theme.colors.accentEmerald,
                borderRadius: '8px',
                boxShadow:
                  loadBarProgress > 60
                    ? `0 0 16px ${theme.colors.accentCoralGlow}`
                    : '0 0 16px rgba(16, 185, 129, 0.5)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
