/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        jarvis: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#6366f1',
          accentHover: '#4f46e5',
          success: '#22c55e',
          warning: '#f59e0b',
          danger: '#ef4444',
          text: '#f1f5f9',
          muted: '#94a3b8',
        },
      },
      animation: {
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
