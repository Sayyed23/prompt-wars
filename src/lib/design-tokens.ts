export const DESIGN_TOKENS = {
  colors: {
    background: '#0a0a0a',
    foreground: '#ededed',
    card: '#141414',
    border: '#262626',
    primary: '#00ffcc', // Acid Teal
    primaryGlow: 'rgba(0, 255, 204, 0.2)',
    secondary: '#ffcc00', // Amber
    alert: '#ff4d00', // Signal Orange
    critical: '#ff0033', // Crimson
    stealth: {
      100: '#1a1a1a',
      200: '#2a2a2a',
      300: '#404040',
    }
  },
  typography: {
    sans: "'Outfit', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  radius: {
    sharp: '2px',
    md: '4px',
  },
  density: {
    low: '#00ffcc',
    moderate: '#ffcc00',
    high: '#ff4d00',
    critical: '#ff0033',
  }
} as const;

export type DesignTheme = typeof DESIGN_TOKENS;
