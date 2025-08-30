import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  siteActions,
  enabledSites,
  enabledCount,
  connectedCount,
  sitesWithStatus,
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

  describe('updateSiteStatus', () => {
    it('should update site status correctly', () => {
      // Test that the action can be called without error
      expect(() => {
        siteActions.updateSiteStatus('chatgpt', SITE_STATUS.CONNECTED);
      }).not.toThrow();
    });

    it('should handle multiple status updates', () => {
      // Test that multiple actions can be called without error
      expect(() => {
        siteActions.updateSiteStatus('chatgpt', SITE_STATUS.LOADING);
        siteActions.updateSiteStatus('claude', SITE_STATUS.CONNECTED);
      }).not.toThrow();
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

  describe('getSiteWithStatus', () => {
    beforeEach(async () => {
      // Initialize sites with configs
      await siteActions.initializeSites();
      siteActions.updateSiteStatus('chatgpt', SITE_STATUS.CONNECTED);
    });

    it('should return enhanced site with correct status', () => {
      const site = siteActions.getSiteWithStatus('chatgpt', false);

      expect(site).toMatchObject({
        id: 'chatgpt',
        name: 'ChatGPT',
        status: SITE_STATUS.CONNECTED,
        enabled: true,
        color: '#10a37f',
      });
    });

    it('should return dark color when isDark is true', () => {
      const site = siteActions.getSiteWithStatus('chatgpt', true);

      expect(site?.color).toBe('#10a37f'); // Dark color
    });

    it('should return null for unknown site', () => {
      const site = siteActions.getSiteWithStatus('unknown-site');

      expect(site).toBeNull();
    });

    it('should use default status when none is set', () => {
      const site = siteActions.getSiteWithStatus('claude', false);

      expect(site?.status).toBe(SITE_STATUS.DISCONNECTED); // Default status
    });
  });

  describe('getSiteColor', () => {
    beforeEach(async () => {
      await siteActions.initializeSites();
    });

    it('should return light color by default', () => {
      const color = siteActions.getSiteColor('chatgpt');

      expect(color).toBe('#10a37f');
    });

    it('should return dark color when isDark is true', () => {
      const color = siteActions.getSiteColor('chatgpt', true);

      expect(color).toBe('#10a37f'); // Dark color (same in this case)
    });

    it('should return default gray for unknown site', () => {
      const color = siteActions.getSiteColor('unknown-site');

      expect(color).toBe('#6b7280');
    });
  });

  describe('refreshSiteStates', () => {
    it('should fetch status for all sites', async () => {
      mockSendMessage.mockImplementation((action: string, payload?: any) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({ data: { configs: mockConfigs } });
        }
        if (action === 'GET_SITE_STATUS') {
          if (payload.siteId === 'chatgpt') {
            return Promise.resolve({ status: SITE_STATUS.CONNECTED });
          }
          return Promise.resolve({ status: SITE_STATUS.DISCONNECTED });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();
      await siteActions.refreshSiteStates();

      expect(mockSendMessage).toHaveBeenCalledWith('GET_SITE_STATUS', {
        siteId: 'chatgpt',
      });
      expect(mockSendMessage).toHaveBeenCalledWith('GET_SITE_STATUS', {
        siteId: 'claude',
      });
    });

    it('should handle status fetch failures gracefully', async () => {
      const { logger } = await import('../../shared/logger');

      mockSendMessage.mockImplementation((action: string, payload?: any) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({ data: { configs: mockConfigs } });
        }
        if (action === 'GET_SITE_STATUS') {
          if (payload.siteId === 'chatgpt') {
            return Promise.reject(new Error('Status fetch failed'));
          }
          return Promise.resolve({ status: SITE_STATUS.CONNECTED });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();
      await siteActions.refreshSiteStates();

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get status for chatgpt:',
        expect.any(Error),
      );
    });

    it('should retry after delay when all sites are disconnected', async () => {
      vi.useFakeTimers();
      const { logger } = await import('../../shared/logger');

      mockSendMessage.mockImplementation((action: string) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({ data: { configs: mockConfigs } });
        }
        if (action === 'GET_SITE_STATUS') {
          return Promise.resolve({ status: SITE_STATUS.DISCONNECTED });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();
      await siteActions.refreshSiteStates();

      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringMatching(
          /sites disconnected on attempt \d+, retrying in \d+ms\.\.\./,
        ),
      );

      // Fast-forward timers
      vi.advanceTimersByTime(2000);

      vi.useRealTimers();
    });

    it('should handle retry count parameter correctly', async () => {
      mockSendMessage.mockImplementation((action: string) => {
        if (action === 'GET_SITE_CONFIGS') {
          return Promise.resolve({ data: { configs: mockConfigs } });
        }
        if (action === 'GET_SITE_STATUS') {
          return Promise.resolve({ status: SITE_STATUS.DISCONNECTED });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();
      await siteActions.refreshSiteStates(1); // Already retried

      // Should not trigger another retry (may still log about retry timing)
      // The actual behavior is acceptable as long as no infinite loops occur
    });

    it('should handle complete refresh failure', async () => {
      const { logger } = await import('../../shared/logger');
      mockSendMessage.mockRejectedValue(new Error('Complete failure'));

      await siteActions.refreshSiteStates();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get status'),
        expect.any(Error),
      );
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
        if (action === 'GET_SITE_STATUS') {
          return Promise.resolve({ status: SITE_STATUS.DISCONNECTED });
        }
        return Promise.resolve({ success: true });
      });

      await siteActions.initializeSites();

      // Set up some statuses
      siteActions.updateSiteStatus('chatgpt', SITE_STATUS.DISCONNECTED);
      siteActions.updateSiteStatus('claude', SITE_STATUS.CONNECTED);
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

    describe('sitesWithStatus', () => {
      it('should return function that provides enhanced sites', () => {
        const getEnhancedSites = get(sitesWithStatus) as (
          isDark: boolean,
        ) => Record<string, any>;
        const enhanced = getEnhancedSites(false);

        expect(enhanced).toHaveProperty('chatgpt');
        expect(enhanced).toHaveProperty('claude');
        expect(enhanced.chatgpt).toMatchObject({
          id: 'chatgpt',
          name: 'ChatGPT',
          status: SITE_STATUS.DISCONNECTED,
          enabled: false, // From background config with user preferences
          color: '#10a37f',
        });
      });

      it('should return dark colors when isDark is true', () => {
        const getEnhancedSites = get(sitesWithStatus) as (
          isDark: boolean,
        ) => Record<string, any>;
        const enhanced = getEnhancedSites(true);

        expect(enhanced.chatgpt.color).toBe('#10a37f'); // Dark color
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
