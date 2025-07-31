export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  color: string;
  hostPatterns: string[];
  inputSelectors: string[];
  submitSelectors: string[];
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    enabled: true,
    color: 'bg-ai-site-chatgpt',
    hostPatterns: ['chatgpt.com'],
    inputSelectors: ['div#prompt-textarea'],
    submitSelectors: ['button#composer-submit-button'],
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    enabled: true,
    color: 'bg-ai-site-claude',
    hostPatterns: ['claude.ai'],
    inputSelectors: ['div[contenteditable]'],
    submitSelectors: ['button[aria-label="Send message"]'],
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    enabled: true,
    color: 'bg-ai-site-gemini',
    hostPatterns: ['gemini.google.com'],
    inputSelectors: ['div.ql-editor[contenteditable]'],
    submitSelectors: ['button.send-button'],
  },

  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    enabled: true,
    color: 'bg-ai-site-grok',
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

export function getSiteByHostname(hostname: string): SiteConfig | null {
  for (const config of Object.values(SITE_CONFIGS)) {
    if (config.hostPatterns.some((pattern) => hostname.includes(pattern))) {
      return config;
    }
  }
  return null;
}

export function getSiteById(siteId: string): SiteConfig | null {
  return SITE_CONFIGS[siteId] || null;
}
