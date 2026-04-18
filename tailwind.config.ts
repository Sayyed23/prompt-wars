import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--card-border)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        alert: 'var(--alert)',
        critical: 'var(--critical)',
        'stealth-100': 'var(--stealth-100)',
        'stealth-200': 'var(--stealth-200)',
        'stealth-300': 'var(--stealth-300)',
        'stealth-400': 'var(--stealth-400)',
        'stealth-500': 'var(--stealth-500)',
        'stealth-900': 'var(--stealth-900)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sharp: 'var(--radius-sharp)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        panel: '0 16px 48px rgba(0, 0, 0, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
