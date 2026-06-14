/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // IMPORTANT: preflight off so Tailwind's base reset doesn't override the
  // hand-written design system in src/index.css.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: '#161a2e',
        bg: '#f5f8fd',
        aqua: { DEFAULT: '#14c4c4', strong: '#0ea7a7' },
        purple: { DEFAULT: '#7a5cff', strong: '#6041e6' },
        yellow: { DEFAULT: '#ffd23f', soft: '#fff3c9' },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.985)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-out': {
          from: { opacity: '1', transform: 'none' },
          to: { opacity: '0', transform: 'translateY(8px) scale(0.985)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-out': 'fade-out 0.26s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 2.4s ease-in-out infinite',
        pop: 'pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
