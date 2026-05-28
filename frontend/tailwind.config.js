/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
      extend: {
        fontFamily: {
          display: ['"DM Serif Display"', 'serif'],
          body: ['"DM Sans"', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace'],
        },
        colors: {
          ink: {
            DEFAULT: '#0F0E17',
            light: '#2D2B3D',
          },
          paper: '#FFFFFE',
          accent: {
            DEFAULT: '#FF6B35',
            hover: '#E85A24',
            muted: '#FFF0EB',
          },
          sage: {
            DEFAULT: '#2EC4B6',
            muted: '#E8F9F8',
          },
          amber: {
            task: '#F7B731',
            muted: '#FFF8E6',
          },
          slate: {
            soft: '#F5F5F7',
            border: '#E4E4E7',
            muted: '#71717A',
          },
        },
        animation: {
          'slide-up': 'slideUp 0.3s ease-out',
          'fade-in': 'fadeIn 0.25s ease-out',
          'scale-in': 'scaleIn 0.2s ease-out',
        },
        keyframes: {
          slideUp: {
            '0%': { transform: 'translateY(12px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          scaleIn: {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' },
          },
        },
      },
    },
    plugins: [],
  };