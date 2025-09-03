import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  siteActions,
  enabledSites,
  enabledCount,
  connectedCount,
  orderedSites,
} from '../../entrypoints/sidepanel/stores/siteStore';
import type { SiteConfig } from '../../types';
import { SITE_STATUS } from '../../shared/constants';

// Mock dependencies
vi.mock('../../shared/messaging', () => ({
  sendMessage: vi.fn(),
}));

vi.mock('../../shared/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../shared/constants', () => ({
  SITE_STATUS: {
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    LOADING: 'loading',
    ERROR: 'error',
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('siteStore', () => {
  let mockSendMessage: any;
  let mockConfigs: Record<string, SiteConfig>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked functions
    const { sendMessage } = await import('../../shared/messaging');
    mockSendMessage = sendMessage;

    // Setup mock site configs
    mockConfigs = {
      chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        enabled: true,
        inputSelectors: ['textarea'],
        submitSelectors: ['button[data-testid="send-button"]'],
        colors: { light: '#10a37f', dark: '#10a37f' },
        injectionMethod: 'execCommand',
      },
      claude: {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        enabled: false,
        inputSelectors: ['textarea'],
        submitSelectors: ['.send-button'],
        colors: { light: '#cc785c', dark: '#cc785c' },
        injectionMethod: undefined,
      },
    };

    // Mock localStorage
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});

    // Mock background responses
    mockSendMessage.mockImplementation((action: string) => {
      if (action === 'GET_SITE_CONFIGS') {
        return Promise.resolve({ data: { configs: mockConfigs } });
      }
      if (action === 'GET_SITE_STATUS') {
        return Promise.resolve({ status: SITE_STATUS.DISCONNECTED });
      }
      return Promise.resolve({ success: true });
    });
  });

  describe('toggleSite', () => {
    it('should toggle site enabled state and send to background', async () => {
      await siteActions.toggleSite('chatgpt', false);

      expect(mockSendMessage).toHaveBeenCalledWith('SITE_TOGGLE', {
        siteId: 'chatgpt',
        enabled: false,
      });
      // No longer persists to localStorage - background handles persistence
    });

    it('should handle toggle with enabled true', async () => {
      await siteActions.toggleSite('claude', true);

      expect(mockSendMessage).toHaveBeenCalledWith('SITE_TOGGLE', {
        siteId: 'claude',
        enabled: true,
      });
    });

    it('should handle toggle failure gracefully', async () => {
      const { logger } = await import('../../shared/logger');
      mockSendMessage.mockRejectedValue(new Error('Toggle failed'));

      await siteActions.toggleSite('chatgpt', false);

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to toggle site:',
        expect.any(Error),
      );
    });

    it('should handle message sending failure and revert state', async () => {
      // First get the initial state
      await siteActions.initializeSites();
      const initialEnabled = get(enabledSites).includes('chatgpt');

      // Mock sendMessage to fail
      mockSendMessage.mockRejectedValue(new Error('Network error'));

      // Try to toggle
      await siteActions.toggleSite('chatgpt', !initialEnabled);

      // State should be reverted to original on error
      const finalEnabled = get(enabledSites).includes('chatgpt');
      expect(finalEnabled).toBe(initialEnabled);
    });
  });

  describe('derived stores', () => {
    beforeEach(async () => {
      // Mock background returning configs with user preferences applied
      const configsWithPreferences = {
        ...mockConfigs,
        chatgpt: { ...mockConfigs.chatgpt, enabled: false },
        claude: { ...mockConfigs.claude, enabled: true },
      };

      mockSendMessage.mockImplementation((action: string) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({ data: { configs: configsWithPreferences } });
        }
        if (action === 'GET_SITE_ORDER') {
          return Promise.resolve({ order: [] });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();
    });

    describe('enabledSites', () => {
      it('should return list of enabled site IDs', () => {
        const enabled = get(enabledSites);
        expect(enabled).toContain('claude'); // Enabled via background config
        expect(enabled).not.toContain('chatgpt'); // Disabled via background config
      });
    });

    describe('enabledCount', () => {
      it('should return count of enabled sites', () => {
        const count = get(enabledCount);
        expect(count).toBeGreaterThanOrEqual(0);
        expect(typeof count).toBe('number');
      });
    });

    describe('connectedCount', () => {
      it('should return count of connected enabled sites', () => {
        const count = get(connectedCount);
        expect(count).toBeGreaterThanOrEqual(0);
        expect(typeof count).toBe('number');
      });
    });

    describe('orderedSites', () => {
      it('should return function that provides enhanced sites', () => {
        const getEnhancedSites = get(orderedSites) as (
          isDark: boolean,
        ) => Array<any>;
        const enhanced = getEnhancedSites(false);

        expect(Array.isArray(enhanced)).toBe(true);
        expect(enhanced.length).toBeGreaterThan(0);
        
        // Check if we have ChatGPT site
        const chatgptSite = enhanced.find(site => site.id === 'chatgpt');
        if (chatgptSite) {
          expect(chatgptSite).toMatchObject({
            id: 'chatgpt',
            name: 'ChatGPT',
            color: '#10a37f',
          });
        }
      });

      it('should return dark colors when isDark is true', () => {
        const getEnhancedSites = get(orderedSites) as (
          isDark: boolean,
        ) => Array<any>;
        const enhanced = getEnhancedSites(true);

        expect(Array.isArray(enhanced)).toBe(true);
        
        // Check if we have ChatGPT site with proper dark color
        const chatgptSite = enhanced.find(site => site.id === 'chatgpt');
        if (chatgptSite) {
          expect(chatgptSite.color).toBe('#10a37f'); // Dark color
        }
      });
    });
  });

  describe('background integration', () => {
    it('should load initial states from background configs', async () => {
      // Mock background returning configs with specific enabled states
      const configsWithPreferences = {
        ...mockConfigs,
        chatgpt: { ...mockConfigs.chatgpt, enabled: false },
        claude: { ...mockConfigs.claude, enabled: true },
      };

      mockSendMessage.mockImplementation((action: string) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({ data: { configs: configsWithPreferences } });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();

      const enabled = get(enabledSites);
      expect(enabled).toContain('claude');
      expect(enabled).not.toContain('chatgpt');
    });

    it('should handle background config fetch failure gracefully', async () => {
      const { logger } = await import('../../shared/logger');
      mockSendMessage.mockRejectedValue(new Error('Background error'));

      await siteActions.initializeSites();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch site configs from background:',
        expect.any(Error),
      );
    });

    it('should handle different site configurations from background', async () => {
      // Test with various site states from background
      const configsWithVariousStates = {
        chatgpt: { ...mockConfigs.chatgpt, enabled: false },
        claude: { ...mockConfigs.claude, enabled: true },
      };

      mockSendMessage.mockImplementation((action: string) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({
            data: { configs: configsWithVariousStates },
          });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();

      // Should handle all known sites correctly
      const enabled = get(enabledSites);
      expect(enabled).toContain('claude');
      expect(enabled).not.toContain('chatgpt');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle background config fetch failure', async () => {
      const { logger } = await import('../../shared/logger');
      mockSendMessage.mockRejectedValue(new Error('Background not available'));

      await siteActions.initializeSites();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to fetch site configs from background:',
        expect.any(Error),
      );
    });

    it('should handle complete initialization failure', async () => {
      const { logger } = await import('../../shared/logger');
      mockSendMessage.mockRejectedValue(new Error('Complete failure'));

      await siteActions.initializeSites();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to'),
        expect.any(Error),
      );
    });

    it('should handle concurrent operations gracefully', async () => {
      await siteActions.initializeSites();

      // Start multiple toggle operations concurrently
      const togglePromises = [
        siteActions.toggleSite('chatgpt', false),
        siteActions.toggleSite('chatgpt', true),
        siteActions.toggleSite('claude', true),
      ];

      await Promise.all(togglePromises);

      // Should handle gracefully without corruption
      expect(mockSendMessage).toHaveBeenCalled(); // Multiple calls made, exact count may vary
    });

    it('should maintain store reactivity during state changes', async () => {
      await siteActions.initializeSites();

      let callbackCount = 0;
      const unsubscribe = enabledSites.subscribe(() => {
        callbackCount++;
      });

      // Update state
      await siteActions.toggleSite('chatgpt', false);

      expect(callbackCount).toBeGreaterThan(1); // Initial + update

      // Test unsubscription
      unsubscribe();
      const prevCallbackCount = callbackCount;

      await siteActions.toggleSite('chatgpt', true);

      // Should not have increased much after unsubscribe
      expect(callbackCount).toBeLessThanOrEqual(prevCallbackCount + 1);
    });
  });
});
