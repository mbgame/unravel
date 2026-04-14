import type { Config } from 'tailwindcss';

/** @type {Config} */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /** Brand colors */
        brand: {
          primary: '#6C63FF',
          secondary: '#FF6584',
          accent: '#43D9AD',
        },
        /** Game surface colors */
        surface: {
          dark: '#0A0A1A',
          card: '#12122A',
          overlay: 'rgba(0, 0, 0, 0.6)',
        },
      },
      fontFamily: {
        game: ['var(--font-game)', 'system-ui', 'sans-serif'],
      },
      /** Minimum touch target size per WCAG 2.5.5 */
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        countUp: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
