import { AIServiceId } from './types';

export interface ServiceConfig {
  id: AIServiceId;
  name: string;
  url: string;
  hostPatterns: string[]; // Patterns to match the hostname
  inputSelectors: string[]; // Selectors to find the input field
  submitSelectors: string[]; // Selectors to find the submit button
  keyboardShortcut?: {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  };
  specialHandling?: {
    useNativeValueSetter?: boolean;
    requiresFocus?: boolean;
    usesContentEditable?: boolean;
    extraEvents?: string[];
  };
}

export const SERVICE_CONFIGS: Record<AIServiceId, ServiceConfig> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    hostPatterns: ['chatgpt.com'],
    inputSelectors: [
      'div#prompt-textarea',
      '[data-testid="composer-input"]',
      '[contenteditable="true"]',
    ],
    submitSelectors: [
      'button#composer-submit-button',
      '[data-testid="send-button"]',
      'button[aria-label="Send message"]',
    ],
    keyboardShortcut: { key: 'Enter' },
    specialHandling: {
      usesContentEditable: true,
      requiresFocus: true,
      extraEvents: ['input', 'compositionend'],
    },
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    hostPatterns: ['claude.ai'],
    inputSelectors: ['div[contenteditable]'],
    submitSelectors: ['button[aria-label="Send message"]'],
    keyboardShortcut: { key: 'Enter' },
    specialHandling: {
      usesContentEditable: true,
      requiresFocus: true,
      extraEvents: ['beforeinput'],
    },
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    hostPatterns: ['gemini.google.com'],
    inputSelectors: ['div.ql-editor[contenteditable]'],
    submitSelectors: ['button.send-button'],
    keyboardShortcut: { key: 'Enter' },
    specialHandling: {
      usesContentEditable: true,
      requiresFocus: true,
      extraEvents: ['compositionstart', 'compositionend'],
    },
  },

  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    hostPatterns: ['grok.com', 'x.com', 'twitter.com'],
    inputSelectors: ['textarea[dir="auto"]'],
    submitSelectors: ['form button[type="submit"]'],
    keyboardShortcut: { key: 'Enter', ctrlKey: true },
    specialHandling: {
      useNativeValueSetter: true,
      requiresFocus: true,
    },
  },
};

export function getServiceByHostname(hostname: string): ServiceConfig | null {
  for (const config of Object.values(SERVICE_CONFIGS)) {
    if (config.hostPatterns.some((pattern) => hostname.includes(pattern))) {
      return config;
    }
  }
  return null;
}
