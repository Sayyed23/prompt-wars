export const DESIGN_TOKENS = {
  colors: {
    background: '#050505',
    foreground: '#f5f5f5',
    card: '#0c0c0c',
    border: '#1a1a1a',
    primary: '#14ffd8', // Cyan Hyper
    primaryGlow: 'rgba(20, 255, 216, 0.15)',
    secondary: '#ffdb29', // Electric Gold
    secondaryGlow: 'rgba(255, 219, 41, 0.1)',
    alert: '#ff5f1f', // Neon Orange
    critical: '#ff003c', // Cyber Red
    stealth: {
      100: '#111111',
      200: '#1a1a1a',
      300: '#333333',
      400: '#666666',
    },
    surface: {
      base: 'rgba(10, 10, 10, 0.6)',
      glass: 'rgba(20, 20, 20, 0.4)',
      accent: 'rgba(20, 255, 216, 0.05)',
    }
  },
  typography: {
    sans: "'Outfit', sans-serif",
    mono: "'JetBrains Mono', monospace",
    weights: {
      light: 300,
      normal: 400,
      semibold: 600,
      bold: 700,
      black: 900,
    }
  },
  radius: {
    sharp: '2px',
    md: '6px',
    lg: '12px',
    full: '9999px',
  },
  density: {
    low: '#14ffd8',
    moderate: '#ffdb29',
    high: '#ff5f1f',
    critical: '#ff003c',
  }
} as const;

export type DesignTheme = typeof DESIGN_TOKENS;
