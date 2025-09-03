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
    stopSelectors: ['button#composer-submit-button[data-testid="stop-button"]'],
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
    stopSelectors: ['button[aria-label="Stop response"]'],
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
    submitSelectors: ['button.send-button.submit'],
    stopSelectors: ['button.send-button.stop'],
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
    submitSelectors: ['form.text-base button[aria-label="Submit"]'],
    stopSelectors: ['form.text-base button[aria-label="Stop model response"]'],
    chatUriPatterns: ['/', '/chat/*', '/c/*'],
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
    stopSelectors: ['button[data-testid="stop-generating-response-button"]'],
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
    stopSelectors: ['button[data-testid="stop-button"]'],
    chatUriPatterns: ['/', '/chats/*'],
  },

  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com/',
    enabled: false,
    colors: {
      light: '#5c6bc0',
      dark: '#3f51b5',
    },
    inputSelectors: ['textarea#chat-input'],
    submitSelectors: [
      'path[d="M8.3125 0.981648C8.66767 1.05456 8.97902 1.20565 9.2627 1.4338C9.48724 1.61444 9.73029 1.85939 9.97949 2.1086L14.707 6.83614L13.293 8.2502L9 3.95723V15.0432H7V3.95723L2.70703 8.2502L1.29297 6.83614L6.02051 2.1086C6.26971 1.85939 6.51277 1.61444 6.7373 1.4338C6.97662 1.24132 7.28445 1.04548 7.6875 0.981648C7.8973 0.948471 8.1031 0.956625 8.3125 0.981648Z"]',
    ],
    stopSelectors: [
      'path[d="M2 4.88006C2 3.68015 2 3.08019 2.30557 2.6596C2.40426 2.52377 2.52371 2.40432 2.65954 2.30563C3.08013 2.00006 3.68009 2.00006 4.88 2.00006H11.12C12.3199 2.00006 12.9199 2.00006 13.3405 2.30563C13.4763 2.40432 13.5957 2.52377 13.6944 2.6596C14 3.08019 14 3.68015 14 4.88006V11.1201C14 12.32 14 12.9199 13.6944 13.3405C13.5957 13.4763 13.4763 13.5958 13.3405 13.6945C12.9199 14.0001 12.3199 14.0001 11.12 14.0001H4.88C3.68009 14.0001 3.08013 14.0001 2.65954 13.6945C2.52371 13.5958 2.40426 13.4763 2.30557 13.3405C2 12.9199 2 12.32 2 11.1201V4.88006Z"]',
    ],
    chatUriPatterns: ['/', '/a/chat/s/*'],
  },

  qwen: {
    id: 'qwen',
    name: 'Qwen',
    url: 'https://chat.qwen.ai/',
    enabled: false,
    colors: {
      light: '#4C68F6',
      dark: '#4C68F6',
    },
    inputSelectors: ['textarea#chat-input'],
    submitSelectors: ['button#send-message-button'],
    stopSelectors: ['div[aria-label="Stop"] button .icon-StopIcon'],
    chatUriPatterns: ['/', '/c/*'],
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
