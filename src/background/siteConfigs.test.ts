import type { SiteConfig } from '@/types';

// Test configurations for mock AI sites
export const TEST_SITE_CONFIGS: Record<string, SiteConfig> = {
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

// Public API - get all test site configurations with auto-generated hostPatterns
export function getAllSiteConfigs(): Record<string, SiteConfig> {
  const configs = { ...TEST_SITE_CONFIGS };

  // Auto-generate hostPatterns from URL to ensure they're always available
  Object.values(configs).forEach((config) => {
    config.hostPatterns = [getHostnameFromUrl(config.url)];
  });

  return configs;
}
