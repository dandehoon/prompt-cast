/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ai-dark': '#1a1a1a',
        'ai-card': '#2d2d2d',
        'ai-border': '#404040',
        'ai-text': '#ffffff',
        'ai-text-secondary': '#cccccc',
        'ai-green': '#4ade80',
        'ai-red': '#f87171',
        'ai-yellow': '#fbbf24',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};
