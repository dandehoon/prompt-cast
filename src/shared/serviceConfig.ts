export interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  color: string;
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
    color: 'bg-green-500',
    hostPatterns: ['chatgpt.com'],
    inputSelectors: ['div#prompt-textarea'],
    submitSelectors: ['button#composer-submit-button'],
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    enabled: true,
    color: 'bg-orange-500',
    hostPatterns: ['claude.ai'],
    inputSelectors: ['div[contenteditable]'],
    submitSelectors: ['button[aria-label="Send message"]'],
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    enabled: true,
    color: 'bg-blue-500',
    hostPatterns: ['gemini.google.com'],
    inputSelectors: ['div.ql-editor[contenteditable]'],
    submitSelectors: ['button.send-button'],
  },

  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    enabled: true,
    color: 'bg-purple-500',
    hostPatterns: ['grok.com'],
    inputSelectors: ['textarea[dir="auto"]'],
    submitSelectors: ['form button[type="submit"]'],
  },

  // perplexity: {
  //   id: 'perplexity',
  //   name: 'Perplexity',
  //   url: 'https://www.perplexity.ai/',
  //   enabled: true,
  //   color: 'bg-teal-500',
  //   hostPatterns: ['perplexity.ai'],
  //   inputSelectors: ['div#ask-input'],
  //   submitSelectors: ['button[data-testid="submit-button"]'],
  // },
};

export function getServiceByHostname(hostname: string): ServiceConfig | null {
  for (const config of Object.values(SERVICE_CONFIGS)) {
    if (config.hostPatterns.some((pattern) => hostname.includes(pattern))) {
      return config;
    }
  }
  return null;
}

export function getServiceById(serviceId: string): ServiceConfig | null {
  return SERVICE_CONFIGS[serviceId] || null;
}
