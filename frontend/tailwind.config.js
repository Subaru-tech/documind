/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          bg: '#191a1f',
          card: '#1e2028',
          hover: '#24262e',
          border: 'rgba(255,255,255,0.08)',
        },
        accent: {
          DEFAULT: '#8ab4f8',
          muted: 'rgba(138,180,248,0.15)',
        },
        ink: {
          DEFAULT: '#e8eaed',
          secondary: '#9aa0a6',
          muted: '#5f6368',
        }
      },
      fontFamily: {
        sans: ['Google Sans Text', 'Google Sans', 'system-ui', 'sans-serif'],
        display: ['Google Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow': '0 0 24px rgba(138,180,248,0.15)',
        'glow-lg': '0 0 48px rgba(138,180,248,0.2)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        'elevated': '0 4px 8px 3px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
