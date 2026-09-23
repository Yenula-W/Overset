import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F7F2',
        ink: {
          DEFAULT: '#161616',
          muted: '#686868',
          faint: '#9A9A96',
        },
        surface: '#FFFFFF',
        line: '#E5E5DF',
        accent: {
          DEFAULT: '#6C63E8',
          soft: '#EFEEFF',
          strong: '#5049D0',
        },
        editor: {
          bg: '#1A1A1D',
          panel: '#232327',
          raised: '#2B2B31',
          line: '#37373F',
          text: '#E8E8EA',
          muted: '#9C9CA6',
        },
        ok: '#4F8A5B',
        okSoft: '#EAF2EC',
        warn: '#B4833A',
        warnSoft: '#FAF2E6',
        danger: '#B4544A',
        dangerSoft: '#F9ECEA',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        hero: ['clamp(2.75rem, 7vw, 5.75rem)', { lineHeight: '0.98', letterSpacing: '-0.035em' }],
        section: ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        sub: ['clamp(1.5rem, 2.6vw, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
      },
      maxWidth: { shell: '1240px' },
      borderRadius: { xl2: '18px' },
      boxShadow: {
        card: '0 1px 2px rgba(22,22,22,0.04), 0 8px 24px -12px rgba(22,22,22,0.10)',
        lift: '0 2px 4px rgba(22,22,22,0.04), 0 24px 56px -24px rgba(22,22,22,0.20)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'region-in': { from: { opacity: '0', transform: 'scale(0.97)' }, to: { opacity: '1', transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.4s ease both',
        'region-in': 'region-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
export default config;
