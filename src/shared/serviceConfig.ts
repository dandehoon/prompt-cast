export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  hostPatterns: string[];
  inputSelectors: string[];
  submitSelectors: string[];
}

export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    enabled: true,
    hostPatterns: ['chatgpt.com'],
    inputSelectors: ['div#prompt-textarea'],
    submitSelectors: ['button#composer-submit-button'],
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    enabled: true,
    hostPatterns: ['claude.ai'],
    inputSelectors: ['div[contenteditable]'],
    submitSelectors: ['button[aria-label="Send message"]'],
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    enabled: true,
    hostPatterns: ['gemini.google.com'],
    inputSelectors: ['div.ql-editor[contenteditable]'],
    submitSelectors: ['button.send-button'],
  },

  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    enabled: true,
    hostPatterns: ['grok.com', 'x.com', 'twitter.com'],
    inputSelectors: ['textarea[dir="auto"]'],
    submitSelectors: ['form button[type="submit"]'],
  },

  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://perplexity.ai/',
    enabled: true,
    hostPatterns: ['perplexity.ai'],
    inputSelectors: ['div[contenteditable]'],
    submitSelectors: ['button[data-testid="submit-button"]'],
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
