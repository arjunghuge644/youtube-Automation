export const theme = {
  colors: {
    bgDark: '#080F22',
    bgRadialCenter: '#0E1D3D',
    gridLine: 'rgba(74, 110, 175, 0.16)',
    gridLineAccent: 'rgba(74, 110, 175, 0.32)',
    cardBg: 'rgba(12, 23, 50, 0.88)',
    cardBgSolid: '#0D1B3A',
    cardBorder: 'rgba(92, 131, 195, 0.32)',
    cardBorderHighlight: '#FFD166',
    accentYellow: '#FFD166',
    accentYellowGlow: 'rgba(255, 209, 102, 0.35)',
    accentCyan: '#38BDF8',
    accentEmerald: '#10B981',
    accentCoral: '#FF5C5C',
    accentCoralGlow: 'rgba(255, 92, 92, 0.35)',
    textPrimary: '#FFFFFF',
    textMuted: '#7C93C1',
    textSecondary: '#94A3B8',
    textSubtle: '#52698F',
  },
  fonts: {
    mono: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
  },
  springs: {
    snappy: { damping: 14, stiffness: 130, mass: 0.6 },
    gentle: { damping: 18, stiffness: 90, mass: 1 },
    bouncy: { damping: 10, stiffness: 100, mass: 0.8 },
  },
} as const;

export type Theme = typeof theme;

