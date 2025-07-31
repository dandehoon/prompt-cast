/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background colors
        'ai-bg-primary': 'var(--pc-bg-primary)',
        'ai-bg-secondary': 'var(--pc-bg-secondary)',
        'ai-bg-card': 'var(--pc-bg-card)',
        'ai-bg-hover': 'var(--pc-bg-hover)',
        'ai-bg-active': 'var(--pc-bg-active)',

        // Border colors
        'ai-border': 'var(--pc-border)',
        'ai-border-hover': 'var(--pc-border-hover)',
        'ai-border-focus': 'var(--pc-border-focus)',

        // Text colors
        'ai-text-primary': 'var(--pc-text-primary)',
        'ai-text-secondary': 'var(--pc-text-secondary)',
        'ai-text-muted': 'var(--pc-text-muted)',
        'ai-text-disabled': 'var(--pc-text-disabled)',
        'ai-text-inverted': 'var(--pc-text-inverted)',

        // Accent colors
        'ai-accent': 'var(--pc-accent)',
        'ai-accent-hover': 'var(--pc-accent-hover)',
        'ai-accent-light': 'var(--pc-accent-light)',
        'ai-focus': 'var(--pc-focus)',

        // Status colors
        'ai-success': 'var(--pc-success)',
        'ai-success-light': 'var(--pc-success-light)',
        'ai-error': 'var(--pc-error)',
        'ai-error-light': 'var(--pc-error-light)',
        'ai-warning': 'var(--pc-warning)',
        'ai-warning-light': 'var(--pc-warning-light)',
        'ai-info': 'var(--pc-info)',
        'ai-info-light': 'var(--pc-info-light)',

        // Site specific colors
        'ai-site-chatgpt': 'var(--pc-site-chatgpt)',
        'ai-site-claude': 'var(--pc-site-claude)',
        'ai-site-gemini': 'var(--pc-site-gemini)',
        'ai-site-grok': 'var(--pc-site-grok)',
        'ai-site-default': 'var(--pc-site-default)',

        // Interactive states
        'ai-interactive-hover': 'var(--pc-interactive-hover)',
        'ai-interactive-active': 'var(--pc-interactive-active)',

        // Legacy status colors for backward compatibility
        'ai-green': 'var(--pc-success)',
        'ai-red': 'var(--pc-error)',
        'ai-yellow': 'var(--pc-warning)',
        'ai-blue': 'var(--pc-info)',
      },
      boxShadow: {
        'ai-sm': 'var(--pc-shadow-sm)',
        'ai-md': 'var(--pc-shadow-md)',
        'ai-lg': 'var(--pc-shadow-lg)',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};
