import React from 'react';
import { theme } from '../theme';

interface BlueprintBackgroundProps {
  width?: number;
  height?: number;
}

export const BlueprintBackground: React.FC<BlueprintBackgroundProps> = ({
  width = 720,
  height = 1280,
}) => {
  const gridSize = 48;
  const numCols = Math.ceil(width / gridSize) + 1;
  const numRows = Math.ceil(height / gridSize) + 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.bgDark,
        backgroundImage: `radial-gradient(circle at 50% 30%, ${theme.colors.bgRadialCenter} 0%, ${theme.colors.bgDark} 85%)`,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* SVG Grid */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.9,
        }}
      >
        <defs>
          <pattern
            id="blueprint-grid"
            width={gridSize}
            height={gridSize}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
              fill="none"
              stroke={theme.colors.gridLine}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

        {/* Subtle coordinate crosshairs at major points */}
        {Array.from({ length: Math.min(numCols, 16) }).map((_, col) => {
          if (col % 4 !== 0) return null;
          return Array.from({ length: Math.min(numRows, 28) }).map((_, row) => {
            if (row % 4 !== 0) return null;
            const x = col * gridSize;
            const y = row * gridSize;
            return (
              <g key={`cross-${col}-${row}`} stroke={theme.colors.gridLineAccent} strokeWidth="1">
                <line x1={x - 4} y1={y} x2={x + 4} y2={y} />
                <line x1={x} y1={y - 4} x2={x} y2={y + 4} />
              </g>
            );
          });
        })}
      </svg>
    </div>
  );
};
