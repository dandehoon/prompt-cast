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
    chatUriPatterns: ['/', '/c/*'],
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
    chatUriPatterns: ['/', '/new', '/chat/*'],
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
    chatUriPatterns: ['/', '/app', '/app/*'],
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
    chatUriPatterns: ['/', '/chat/*'],
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    enabled: false,
    colors: {
      light: '#31b8c6',
      dark: '#31b8c6',
    },
    inputSelectors: ['div#ask-input'],
    submitSelectors: ['button[data-testid="submit-button"]'],
    injectionMethod: 'execCommand',
    chatUriPatterns: ['/', '/search/*'],
  },

  copilot: {
    id: 'copilot',
    name: 'Copilot',
    url: 'https://copilot.microsoft.com/',
    enabled: false,
    colors: {
      light: '#d84a12ff',
      dark: '#d84a12ff',
    },
    inputSelectors: ['textarea#userInput'],
    submitSelectors: ['button[data-testid="submit-button"]'],
    chatUriPatterns: ['/', '/chats/*'],
  },
};

// Public API - get all site configurations with auto-generated hostPatterns
export function getAllSiteConfigs(): Record<string, SiteConfig> {
  const isTestMode = import.meta.env?.NODE_ENV === 'test';
  const configs: Record<string, SiteConfig> = {};
  for (const [id, config] of Object.entries(SITE_CONFIGS)) {
    if (isTestMode) {
      if (!['gemini', 'claude'].includes(id)) {
        continue;
      }
      config.url = 'http://localhost:3000/' + config.id;
    }
    configs[id] = { ...config };
  }

  return configs;
}
