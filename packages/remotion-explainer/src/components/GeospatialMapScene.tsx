import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';
import type { GeospatialMapProps } from '@creatorflow/shared';

export const GeospatialMapScene: React.FC<{ props: GeospatialMapProps }> = ({ props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Pulse animation for customer radius
  const pulseScale = 1 + (Math.sin(frame * 0.15) + 1) * 0.05;

  // Stream data packets down to database
  const streamActive = frame > 15;

  // Transition from DB overload to Geo Index card
  const showGeoIndex = frame > 50;
  const geoIndexEntrance = spring({
    frame: frame - 50,
    fps,
    config: theme.springs.snappy,
  });

  // Location writes counter animation
  const counterValue = Math.min(
    2434,
    Math.floor(interpolate(frame, [10, 48], [120, 2434], { extrapolateRight: 'clamp' }))
  );

  // Simulated rider pins
  const riders = [
    { x: 120, y: 110, angle: 45, speed: 1.2 },
    { x: 220, y: 80, angle: -30, speed: 0.9 },
    { x: 380, y: 95, angle: 110, speed: 1.4 },
    { x: 480, y: 130, angle: -60, speed: 1.1 },
    { x: 160, y: 220, angle: 15, speed: 0.8 },
    { x: 440, y: 240, angle: -120, speed: 1.3 },
    { x: 260, y: 310, angle: 80, speed: 1.0 },
    { x: 360, y: 330, angle: -45, speed: 1.5 },
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
      }}
    >
      {/* Blueprint Geospatial Map Card */}
      <div
        style={{
          width: '100%',
          height: '460px',
          backgroundColor: theme.colors.cardBg,
          border: `2px solid ${theme.colors.cardBorder}`,
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Map Vector Streets & River */}
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Subtle street grid */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 60 + 20}
              x2="600"
              y2={i * 60 + 20}
              stroke="rgba(80, 120, 180, 0.12)"
              strokeWidth="1.5"
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 70 + 20}
              y1="0"
              x2={i * 70 + 20}
              y2="460"
              stroke="rgba(80, 120, 180, 0.12)"
              strokeWidth="1.5"
            />
          ))}

          {/* Curved highway / river path */}
          <path
            d="M -20,380 Q 200,280 400,140 T 650,40"
            fill="none"
            stroke="rgba(56, 189, 248, 0.28)"
            strokeWidth="32"
            strokeLinecap="round"
          />
          <path
            d="M -20,380 Q 200,280 400,140 T 650,40"
            fill="none"
            stroke="rgba(56, 189, 248, 0.12)"
            strokeWidth="56"
          />

          {/* Secondary streets */}
          <path
            d="M 50,40 L 520,420"
            fill="none"
            stroke="rgba(124, 147, 193, 0.2)"
            strokeWidth="8"
          />
          <path
            d="M 580,180 L 10,260"
            fill="none"
            stroke="rgba(124, 147, 193, 0.2)"
            strokeWidth="6"
          />

          {/* Dotted Radius Circle around Customer */}
          <circle
            cx="300"
            cy="210"
            r={70 * pulseScale}
            fill="rgba(255, 209, 102, 0.04)"
            stroke={theme.colors.textPrimary}
            strokeWidth="2"
            strokeDasharray="6,6"
          />

          {/* Radius Distance Line */}
          <line
            x1="300"
            y1="210"
            x2="300"
            y2={210 + 70 * pulseScale}
            stroke={theme.colors.textPrimary}
            strokeWidth="2"
          />

          {/* Customer Location Pin */}
          <g transform="translate(288, 180)">
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12zm0 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
              fill={theme.colors.accentYellow}
              filter="drop-shadow(0 0 8px rgba(255, 209, 102, 0.8))"
            />
          </g>

          {/* 3 km label */}
          <rect
            x="310"
            y="250"
            width="64"
            height="26"
            rx="6"
            fill="rgba(13, 27, 58, 0.85)"
            stroke={theme.colors.cardBorder}
          />
          <text
            x="342"
            y="268"
            fill={theme.colors.textPrimary}
            fontSize="14"
            fontFamily={theme.fonts.mono}
            fontWeight="700"
            textAnchor="middle"
          >
            {props.customer.radiusKm} km
          </text>

          {/* Animated Rider Pins */}
          {riders.map((r, i) => {
            const currentRiderX = r.x + Math.cos(r.angle) * (frame * r.speed * 0.4);
            const currentRiderY = r.y + Math.sin(r.angle) * (frame * r.speed * 0.4);

            return (
              <g key={i}>
                {/* Rider motion trail */}
                <line
                  x1={currentRiderX - Math.cos(r.angle) * 14}
                  y1={currentRiderY - Math.sin(r.angle) * 14}
                  x2={currentRiderX}
                  y2={currentRiderY}
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="2"
                />
                {/* Rider circle with inner dot */}
                <circle
                  cx={currentRiderX}
                  cy={currentRiderY}
                  r="7"
                  fill="none"
                  stroke={theme.colors.textPrimary}
                  strokeWidth="2"
                />
                <circle cx={currentRiderX} cy={currentRiderY} r="3" fill={theme.colors.textPrimary} />
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
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="28" height="34" viewBox="0 0 40 48" fill="none">
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
                  fontSize: '20px',
                  fontWeight: 800,
                  color: theme.colors.accentYellow,
                }}
              >
                POSTGRES
              </div>
            </div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '14px',
                color: theme.colors.textMuted,
              }}
            >
              ₹ WALLET
            </div>
          </div>

          {/* High-frequency write counter */}
          <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: '13px',
                letterSpacing: '2px',
                color: theme.colors.textMuted,
                fontWeight: 600,
              }}
            >
              {props.dataStreamLabel}
            </div>
            <div
              style={{
                fontFamily: theme.fonts.sans,
                fontSize: '44px',
                fontWeight: 800,
                color: theme.colors.textPrimary,
                letterSpacing: '-1px',
              }}
            >
              {counterValue.toLocaleString()}
            </div>

            {/* Load bar */}
            <div>
              <div
                style={{
                  width: '100%',
                  height: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${props.loadPercentage}%`,
                    height: '100%',
                    backgroundColor: theme.colors.accentYellow,
                    boxShadow: `0 0 10px ${theme.colors.accentYellowGlow}`,
                  }}
                />
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
            padding: '30px 36px',
            boxSizing: 'border-box',
            opacity: geoIndexEntrance,
            transform: `scale(${interpolate(geoIndexEntrance, [0, 1], [0.94, 1])})`,
            boxShadow: `0 0 28px ${theme.colors.accentYellowGlow}`,
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '2px',
              color: theme.colors.accentYellow,
              marginBottom: '10px',
            }}
          >
            {props.indexCard.title}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: '18px',
              color: theme.colors.textMuted,
              letterSpacing: '1px',
            }}
          >
            {props.indexCard.subtitle}
          </div>
        </div>
      )}
    </div>
  );
};
