import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { GeospatialMapProps } from '@creatorflow/shared';

export const GeospatialMapScene: React.FC<{ props: GeospatialMapProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Dynamic milestones scaled to narration duration
  const streamStartFrame = Math.max(5, Math.floor(durationInFrames * 0.08));
  const showGeoIndexFrame = Math.floor(durationInFrames * 0.50);
  const counterEndFrame = Math.floor(durationInFrames * 0.46);

  // Pulse animation for customer radius
  const pulseScale = 1 + (Math.sin(frame * 0.15) + 1) * 0.06;

  // Stream data packets down to database
  const streamActive = frame > streamStartFrame;

  // Transition from DB overload to Geo Index card
  const showGeoIndex = frame > showGeoIndexFrame;
  const geoIndexEntrance = spring({
    frame: frame - showGeoIndexFrame,
    fps,
    config: theme.springs.snappy,
  });

  // Location writes counter animation
  const maxWrites = parseInt(props.writeCount.replace(/,/g, ''), 10) || 2434;
  const counterValue = Math.min(
    maxWrites,
    Math.floor(
      interpolate(frame, [streamStartFrame, counterEndFrame], [120, maxWrites], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    )
  );

  // Simulated rider pins with radar tracking
  const riders = [
    { id: 'R-01', x: 110, y: 120, angle: 45, speed: 1.2 },
    { id: 'R-02', x: 230, y: 90, angle: -30, speed: 0.9 },
    { id: 'R-03', x: 420, y: 105, angle: 110, speed: 1.4 },
    { id: 'R-04', x: 510, y: 150, angle: -60, speed: 1.1 },
    { id: 'R-05', x: 140, y: 250, angle: 15, speed: 0.8 },
    { id: 'R-06', x: 460, y: 270, angle: -120, speed: 1.3 },
    { id: 'R-07', x: 250, y: 370, angle: 80, speed: 1.0 },
    { id: 'R-08', x: 380, y: 390, angle: -45, speed: 1.5 },
  ];

  // Radar sweep angle
  const radarAngle = (frame * 0.06) % (Math.PI * 2);
  const sweepRadius = 160;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 40px',
        width: '100%',
        boxSizing: 'border-box',
        gap: '24px',
      }}
    >
      {/* Blueprint Geospatial Map Card */}
      <div
        style={{
          width: '100%',
          height: '520px',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.cardBorder}`,
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Map Header Status Bar */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 20,
            right: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(8, 15, 34, 0.85)',
              padding: '6px 14px',
              borderRadius: '12px',
              border: `1px solid ${theme.colors.cardBorder}`,
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: theme.colors.accentYellow,
                boxShadow: `0 0 8px ${theme.colors.accentYellowGlow}`,
              }}
            />
            <span
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '13px',
                fontWeight: 700,
                color: theme.colors.textPrimary,
                letterSpacing: '1px',
              }}
            >
              LIVE RIDER MESH (3 KM RADIUS)
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(8, 15, 34, 0.85)',
              padding: '6px 12px',
              borderRadius: '10px',
              border: `1px solid ${theme.colors.cardBorder}`,
              fontFamily: theme.fonts.mono,
              fontSize: '12px',
              color: theme.colors.accentCyan,
            }}
          >
            PING: 5s CADENCE
          </div>
        </div>

        {/* Map Vector Streets & Radar */}
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Subtle street grid */}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 60 + 20}
              x2="640"
              y2={i * 60 + 20}
              stroke="rgba(80, 120, 180, 0.12)"
              strokeWidth="1.5"
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 70 + 20}
              y1="0"
              x2={i * 70 + 20}
              y2="520"
              stroke="rgba(80, 120, 180, 0.12)"
              strokeWidth="1.5"
            />
          ))}

          {/* Curved highway / river path */}
          <path
            d="M -20,440 Q 200,320 400,160 T 670,40"
            fill="none"
            stroke="rgba(56, 189, 248, 0.28)"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            d="M -20,440 Q 200,320 400,160 T 670,40"
            fill="none"
            stroke="rgba(56, 189, 248, 0.12)"
            strokeWidth="56"
          />

          {/* Secondary streets */}
          <path
            d="M 50,40 L 580,480"
            fill="none"
            stroke="rgba(124, 147, 193, 0.2)"
            strokeWidth="8"
          />
          <path
            d="M 600,200 L 10,310"
            fill="none"
            stroke="rgba(124, 147, 193, 0.2)"
            strokeWidth="6"
          />

          {/* Radar Sweep Line */}
          <line
            x1="320"
            y1="250"
            x2={320 + Math.cos(radarAngle) * sweepRadius}
            y2={250 + Math.sin(radarAngle) * sweepRadius}
            stroke="rgba(255, 209, 102, 0.35)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* Dotted Radius Circle around Customer */}
          <circle
            cx="320"
            cy="250"
            r={85 * pulseScale}
            fill="rgba(255, 209, 102, 0.05)"
            stroke={theme.colors.accentYellow}
            strokeWidth="2.5"
            strokeDasharray="6,6"
          />

          {/* Outer Range Ring */}
          <circle
            cx="320"
            cy="250"
            r={140}
            fill="none"
            stroke="rgba(255, 209, 102, 0.15)"
            strokeWidth="1.5"
            strokeDasharray="8,8"
          />

          {/* Customer Location Pin */}
          <g transform="translate(308, 222)">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
              fill={theme.colors.accentYellow}
              filter="drop-shadow(0 0 12px rgba(255, 209, 102, 0.9))"
            />
          </g>

          {/* 3 km label */}
          <rect
            x="332"
            y="290"
            width="80"
            height="30"
            rx="8"
            fill="rgba(13, 27, 58, 0.9)"
            stroke={theme.colors.accentYellow}
            strokeWidth="1.5"
          />
          <text
            x="372"
            y="311"
            fill={theme.colors.accentYellow}
            fontSize="15"
            fontFamily={theme.fonts.mono}
            fontWeight="800"
            textAnchor="middle"
          >
            {props.customer.radiusKm} KM
          </text>

          {/* Animated Rider Pins */}
          {riders.map((r, i) => {
            const currentRiderX = r.x + Math.cos(r.angle) * (frame * r.speed * 0.4);
            const currentRiderY = r.y + Math.sin(r.angle) * (frame * r.speed * 0.4);

            return (
              <g key={i}>
                {/* Rider motion trail */}
                <line
                  x1={currentRiderX - Math.cos(r.angle) * 16}
                  y1={currentRiderY - Math.sin(r.angle) * 16}
                  x2={currentRiderX}
                  y2={currentRiderY}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="2"
                />
                {/* Rider pulse ripple */}
                <circle
                  cx={currentRiderX}
                  cy={currentRiderY}
                  r={8 + (Math.sin(frame * 0.2 + i) + 1) * 3}
                  fill="none"
                  stroke={theme.colors.accentCyan}
                  strokeWidth="1"
                  opacity={0.6}
                />
                {/* Rider circle with inner dot */}
                <circle
                  cx={currentRiderX}
                  cy={currentRiderY}
                  r="8"
                  fill="rgba(13, 27, 58, 0.8)"
                  stroke={theme.colors.textPrimary}
                  strokeWidth="2"
                />
                <circle cx={currentRiderX} cy={currentRiderY} r="3.5" fill={theme.colors.accentCyan} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Downward Data Stream & Database / Geo Index Card */}
      {!showGeoIndex ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* Cylinder Postgres Card */}
          <div
            style={{
              flex: 1,
              backgroundColor: theme.colors.cardBg,
              border: `2px solid ${theme.colors.cardBorder}`,
              borderRadius: '20px',
              padding: '24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
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
                  fontSize: '22px',
                  fontWeight: 800,
                  color: theme.colors.accentYellow,
                  letterSpacing: '1px',
                }}
              >
                POSTGRES
              </div>
            </div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '15px',
                fontWeight: 700,
                color: theme.colors.textMuted,
              }}
            >
              ₹ WALLET & ORDERS
            </div>
          </div>

          {/* High-frequency write counter */}
          <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '14px',
                letterSpacing: '2px',
                color: theme.colors.textMuted,
                fontWeight: 700,
              }}
            >
              {props.dataStreamLabel}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: '48px',
                fontWeight: 800,
                color: theme.colors.textPrimary,
                letterSpacing: '-1px',
                lineHeight: 1,
              }}
            >
              {counterValue.toLocaleString()}
            </div>

            {/* Load bar */}
            <div>
              <div
                style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${props.loadPercentage}%`,
                    height: '100%',
                    backgroundColor: theme.colors.accentYellow,
                    boxShadow: `0 0 12px ${theme.colors.accentYellowGlow}`,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontFamily: theme.fonts.mono,
                  fontSize: '12px',
                  color: theme.colors.accentCoral,
                  fontWeight: 700,
                }}
              >
                LOAD: {props.loadPercentage}% CAPACITY
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Transitioned Card: Geo Index (Redis GEO / Geohash) */
        <div
          style={{
            width: '100%',
            backgroundColor: theme.colors.cardBg,
            border: `2px solid ${theme.colors.accentYellow}`,
            borderRadius: '24px',
            padding: '32px 36px',
            boxSizing: 'border-box',
            opacity: geoIndexEntrance,
            transform: `scale(${interpolate(geoIndexEntrance, [0, 1], [0.94, 1])})`,
            boxShadow: `0 0 32px ${theme.colors.accentYellowGlow}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '26px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: theme.colors.accentYellow,
              }}
            >
              {props.indexCard.title}
            </div>
            <div
              style={{
                backgroundColor: theme.colors.accentYellow,
                color: '#000000',
                fontFamily: theme.fonts.mono,
                fontSize: '12px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px',
              }}
            >
              O(1) LOOKUP
            </div>
          </div>

          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '19px',
              color: theme.colors.textPrimary,
              letterSpacing: '1px',
              fontWeight: 600,
            }}
          >
            {props.indexCard.subtitle}
          </div>

          <div
            style={{
              fontFamily: theme.fonts.sans,
              fontSize: '15px',
              color: theme.colors.accentEmerald,
              fontWeight: 700,
              marginTop: '4px',
            }}
          >
            ✓ In-Memory Spatial Indexing eliminates DB write bottlenecks
          </div>
        </div>
      )}
    </div>
  );
};

