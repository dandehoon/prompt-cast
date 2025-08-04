import type { SiteConfig } from '../../types/site';

// PRIVATE: Only used for store initialization - do not export or import elsewhere
const SITE_CONFIGS: Record<string, SiteConfig> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    enabled: true,
    colors: {
      light: '#14ba91',
      dark: '#10a37f',
    },
    hostPatterns: ['chatgpt.com'],
    inputSelectors: ['div#prompt-textarea'],
    submitSelectors: ['button#composer-submit-button'],
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    enabled: true,
    colors: {
      light: '#cc785c',
      dark: '#cc785c',
    },
    hostPatterns: ['claude.ai'],
    inputSelectors: ['div[contenteditable]'],
    submitSelectors: ['button[aria-label="Send message"]'],
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    enabled: true,
    colors: {
      light: '#4285f4',
      dark: '#4285f4',
    },
    hostPatterns: ['gemini.google.com'],
    inputSelectors: ['div.ql-editor[contenteditable]'],
    submitSelectors: ['button.send-button'],
  },

  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    enabled: true,
    colors: {
      light: '#5d5d5d',
      dark: '#7d7d7d',
    },
    hostPatterns: ['grok.com'],
    inputSelectors: ['textarea[dir="auto"]'],
    submitSelectors: ['form button[type="submit"]'],
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    enabled: true,
    colors: {
      light: '#6b7280',
      dark: '#6b7280',
    },
    hostPatterns: ['perplexity.ai'],
    inputSelectors: ['div#ask-input'],
    submitSelectors: ['button[data-testid="submit-button"]'],
  },
};

export const DEFAULT_SITE_COLORS = {
  light: '#6b7280',
  dark: '#6b7280',
};

// Public API - only initialization function allowed
export function getAllSiteConfigs(): Record<string, SiteConfig> {
  return { ...SITE_CONFIGS };
}
