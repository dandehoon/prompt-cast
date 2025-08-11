import type { SiteConfig } from '@/types';

// Site configurations for all supported AI sites
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
    inputSelectors: ['textarea[dir="auto"]'],
    submitSelectors: ['form button[type="submit"]'],
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    enabled: true,
    colors: {
      light: '#31b8c6',
      dark: '#31b8c6',
    },
    inputSelectors: ['div#ask-input'],
    submitSelectors: ['button[data-testid="submit-button"]'],
    injectionMethod: 'execCommand',
  },

  copilot: {
    id: 'copilot',
    name: 'Copilot',
    url: 'https://copilot.microsoft.com/',
    enabled: true,
    colors: {
      light: '#d84a12ff',
      dark: '#d84a12ff',
    },
    inputSelectors: ['textarea#userInput'],
    submitSelectors: ['button[data-testid="submit-button"]'],
  },
};

// Test configurations will be replaced at build time if needed
const TEST_SITE_CONFIGS: Record<string, SiteConfig> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'http://localhost:3000/chatgpt',
    enabled: true,
    colors: {
      light: '#14ba91',
      dark: '#10a37f',
    },
    inputSelectors: ['#prompt-textarea'],
    submitSelectors: ['[data-testid="send-button"]'],
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'http://localhost:3000/claude',
    enabled: true,
    colors: {
      light: '#cc785c',
      dark: '#cc785c',
    },
    inputSelectors: ['.message-input'],
    submitSelectors: ['[data-testid="send-button"]'],
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'http://localhost:3000/gemini',
    enabled: true,
    colors: {
      light: '#4285f4',
      dark: '#4285f4',
    },
    inputSelectors: ['.search-box'],
    submitSelectors: ['[data-testid="search-button"]'],
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'http://localhost:3000/perplexity',
    enabled: true,
    colors: {
      light: '#31b8c6',
      dark: '#31b8c6',
    },
    inputSelectors: ['#ask-input'],
    submitSelectors: ['[data-testid="submit-button"]'],
    injectionMethod: 'execCommand',
  },
};

/**
 * Extract hostname from URL for hostPatterns
 */
function getHostnameFromUrl(url: string): string {
  try {
    const urlObj = new globalThis.URL(url);
    return urlObj.hostname;
  } catch {
    // Fallback for invalid URLs
    return url.replace(/^https?:\/\//, '').split('/')[0];
  }
}

// Public API - get all site configurations with auto-generated hostPatterns
export function getAllSiteConfigs(): Record<string, SiteConfig> {
  // Use build-time flag to determine which configs to use
  const isTestMode = import.meta.env?.NODE_ENV === 'test';
  const configs = isTestMode ? { ...TEST_SITE_CONFIGS } : { ...SITE_CONFIGS };

  // Auto-generate hostPatterns from URL to ensure they're always available
  Object.values(configs).forEach((config) => {
    config.hostPatterns = [getHostnameFromUrl(config.url)];
  });

  return configs;
}
