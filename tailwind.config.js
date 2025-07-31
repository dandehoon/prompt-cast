/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Background colors
        'ai-bg-primary': 'var(--ai-bg-primary)',
        'ai-bg-secondary': 'var(--ai-bg-secondary)',
        'ai-bg-card': 'var(--ai-bg-card)',
        'ai-bg-hover': 'var(--ai-bg-hover)',
        'ai-bg-active': 'var(--ai-bg-active)',

        // Border colors
        'ai-border': 'var(--ai-border)',
        'ai-border-hover': 'var(--ai-border-hover)',
        'ai-border-focus': 'var(--ai-border-focus)',

        // Text colors
        'ai-text-primary': 'var(--ai-text-primary)',
        'ai-text-secondary': 'var(--ai-text-secondary)',
        'ai-text-muted': 'var(--ai-text-muted)',
        'ai-text-disabled': 'var(--ai-text-disabled)',
        'ai-text-inverted': 'var(--ai-text-inverted)',

        // Accent colors
        'ai-accent': 'var(--ai-accent)',
        'ai-accent-hover': 'var(--ai-accent-hover)',
        'ai-accent-light': 'var(--ai-accent-light)',
        'ai-focus': 'var(--ai-focus)',

        // Status colors
        'ai-success': 'var(--ai-success)',
        'ai-success-light': 'var(--ai-success-light)',
        'ai-error': 'var(--ai-error)',
        'ai-error-light': 'var(--ai-error-light)',
        'ai-warning': 'var(--ai-warning)',
        'ai-warning-light': 'var(--ai-warning-light)',
        'ai-info': 'var(--ai-info)',
        'ai-info-light': 'var(--ai-info-light)',

        // Service specific colors
        'ai-service-chatgpt': 'var(--ai-service-chatgpt)',
        'ai-service-claude': 'var(--ai-service-claude)',
        'ai-service-gemini': 'var(--ai-service-gemini)',
        'ai-service-grok': 'var(--ai-service-grok)',
        'ai-service-default': 'var(--ai-service-default)',

        // Interactive states
        'ai-interactive-hover': 'var(--ai-interactive-hover)',
        'ai-interactive-active': 'var(--ai-interactive-active)',

        // Legacy status colors for backward compatibility
        'ai-green': 'var(--ai-success)',
        'ai-red': 'var(--ai-error)',
        'ai-yellow': 'var(--ai-warning)',
        'ai-blue': 'var(--ai-info)',
      },
      boxShadow: {
        'ai-sm': 'var(--ai-shadow-sm)',
        'ai-md': 'var(--ai-shadow-md)',
        'ai-lg': 'var(--ai-shadow-lg)',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
};
