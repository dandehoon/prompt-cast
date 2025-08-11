import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageHandler } from '../../background/messageHandler';
import type { SiteConfig, SendMessagePayload } from '@/types';
import { fakeBrowser } from 'wxt/testing';

vi.mock('../../shared/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../background/messaging', () => ({
  BackgroundMessaging: {
    isContentScriptReady: vi.fn(),
  },
}));

vi.mock('../../background/tabManager', () => ({
  TabManager: vi.fn().mockImplementation(() => ({
    openOrFocusTab: vi.fn(),
    focusTab: vi.fn(),
  })),
}));

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockSites: Record<string, SiteConfig>;
  let mockTabManager: any;
  let mockBrowser: any;
  let mockBackgroundMessaging: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock sites
    mockSites = {
      'chatgpt': {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        enabled: true,
        inputSelectors: ['textarea'],
        submitSelectors: ['button[data-testid="send-button"]'],
        colors: { light: '#10a37f', dark: '#10a37f' },
        injectionMethod: 'execCommand',
      },
      'claude': {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        enabled: true,
        inputSelectors: ['textarea'],
        submitSelectors: ['.send-button'],
        colors: { light: '#cc785c', dark: '#cc785c' },
        injectionMethod: undefined,
      },
      'disabled-site': {
        id: 'disabled-site',
        name: 'Disabled Site',
        url: 'https://disabled.com',
        enabled: false,
        inputSelectors: ['textarea'],
        submitSelectors: ['.send-button'],
        colors: { light: '#000000', dark: '#ffffff' },
        injectionMethod: undefined,
      },
    };

    // Get mocked dependencies from WXT
    mockBrowser = fakeBrowser;
    // Set up browser mock functions
    mockBrowser.tabs = {
      query: vi.fn(),
    };

    const { BackgroundMessaging } = await import('../../background/messaging');
    mockBackgroundMessaging = BackgroundMessaging;

    // Get mocked TabManager
    const { TabManager } = await import('../../background/tabManager');
    mockTabManager = {
      openOrFocusTab: vi.fn(),
      focusTab: vi.fn(),
    };
    vi.mocked(TabManager).mockImplementation(() => mockTabManager);

    messageHandler = new MessageHandler(mockSites, mockTabManager);
  });

  function createMockTab(overrides: any = {}) {
    return {
      id: 1,
      url: 'https://chat.openai.com/chat',
      title: 'ChatGPT',
      status: 'complete',
      windowId: 100,
      ...overrides,
    };
  }

  describe('getSiteStatus', () => {
    it('should return "disconnected" when no tabs exist', async () => {
      mockBrowser.tabs.query.mockResolvedValue([]);

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('disconnected');
      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({
        url: 'https://chat.openai.com*',
      });
    });

    it('should return "disconnected" when tab has no ID', async () => {
      const tabWithoutId = createMockTab({ id: undefined });
      mockBrowser.tabs.query.mockResolvedValue([tabWithoutId]);

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('disconnected');
    });

    it('should return "connected" when content script is ready', async () => {
      const tab = createMockTab();
      mockBrowser.tabs.query.mockResolvedValue([tab]);
      mockBackgroundMessaging.isContentScriptReady.mockResolvedValue(true);

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('connected');
      expect(mockBackgroundMessaging.isContentScriptReady).toHaveBeenCalledWith(
        1,
      );
    });

    it('should return "loading" when content script is not ready', async () => {
      const tab = createMockTab();
      mockBrowser.tabs.query.mockResolvedValue([tab]);
      mockBackgroundMessaging.isContentScriptReady.mockResolvedValue(false);

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('loading');
    });

    it('should return "loading" when content script check fails', async () => {
      const tab = createMockTab();
      mockBrowser.tabs.query.mockResolvedValue([tab]);
      mockBackgroundMessaging.isContentScriptReady.mockRejectedValue(
        new Error('Check failed'),
      );

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('loading');
    });

    it('should return "error" when tab query fails', async () => {
      mockBrowser.tabs.query.mockRejectedValue(new Error('Query failed'));

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('error');
    });
  });

  describe('sendMessageToSitesRobust', () => {
    let mockSendToSingleSite: any;

    beforeEach(() => {
      // Mock the private sendToSingleSite method
      mockSendToSingleSite = vi.fn();
      (messageHandler as any).sendToSingleSite = mockSendToSingleSite;

      // Mock the private openAllTabsWithInstantFocus method
      (messageHandler as any).openAllTabsWithInstantFocus = vi.fn();
    });

    it('should successfully send message to all sites', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite.mockResolvedValue({ success: true });

      await messageHandler.sendMessageToSitesRobust(payload);

      expect(
        (messageHandler as any).openAllTabsWithInstantFocus,
      ).toHaveBeenCalledWith(payload);
      expect(mockSendToSingleSite).toHaveBeenCalledTimes(2);
      expect(mockSendToSingleSite).toHaveBeenCalledWith(
        'chatgpt',
        'Hello world',
      );
      expect(mockSendToSingleSite).toHaveBeenCalledWith(
        'claude',
        'Hello world',
      );
    });

    it('should handle partial failures gracefully', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Claude failed'));

      // Should not throw for partial failure
      await expect(
        messageHandler.sendMessageToSitesRobust(payload),
      ).resolves.toBeUndefined();
    });

    it('should throw when all sites fail', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite.mockRejectedValue(new Error('Site failed'));

      await expect(
        messageHandler.sendMessageToSitesRobust(payload),
      ).rejects.toThrow('Failed to deliver message');
    });

    it('should filter out disabled sites', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'disabled-site'],
      };

      mockSendToSingleSite.mockResolvedValue({ success: true });

      await messageHandler.sendMessageToSitesRobust(payload);

      expect(mockSendToSingleSite).toHaveBeenCalledTimes(1);
      expect(mockSendToSingleSite).toHaveBeenCalledWith(
        'chatgpt',
        'Hello world',
      );
    });

    it('should handle empty enabled sites list', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['disabled-site'],
      };

      await expect(
        messageHandler.sendMessageToSitesRobust(payload),
      ).rejects.toThrow('Failed to deliver message');
    });
  });

  describe('openAllTabsWithInstantFocus (private method testing)', () => {
    let openAllTabsWithInstantFocus: any;

    beforeEach(() => {
      // Access the private method for testing
      openAllTabsWithInstantFocus = (
        messageHandler as any
      ).openAllTabsWithInstantFocus.bind(messageHandler);
    });

    it('should open tabs for all enabled sites', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockBrowser.tabs.query
        .mockResolvedValueOnce([createMockTab()]) // Current active tab (non-AI)
        .mockResolvedValueOnce([]) // No existing ChatGPT tabs
        .mockResolvedValueOnce([]); // No existing Claude tabs

      await openAllTabsWithInstantFocus(payload);

      expect(mockTabManager.openOrFocusTab).toHaveBeenCalledTimes(2);
      expect(mockTabManager.openOrFocusTab).toHaveBeenCalledWith(
        mockSites.chatgpt,
        false,
      );
      expect(mockTabManager.openOrFocusTab).toHaveBeenCalledWith(
        mockSites.claude,
        false,
      );
    });

    it('should focus first new tab when current tab is not AI site', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      // Mock current tab as non-AI site
      const currentTab = createMockTab({ url: 'https://google.com' });
      mockBrowser.tabs.query
        .mockResolvedValueOnce([currentTab]) // Current active tab
        .mockResolvedValueOnce([]) // No existing ChatGPT tabs (new tab)
        .mockResolvedValueOnce([createMockTab({ url: 'https://claude.ai' })]); // Existing Claude tab

      await openAllTabsWithInstantFocus(payload);

      expect(mockTabManager.focusTab).toHaveBeenCalledWith('chatgpt');
    });

    it('should not focus any tab when current tab is AI site', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      // Mock current tab as AI site
      const currentTab = createMockTab({ url: 'https://chat.openai.com/chat' });
      mockBrowser.tabs.query
        .mockResolvedValueOnce([currentTab]) // Current active tab (AI site)
        .mockResolvedValueOnce([]) // No existing ChatGPT tabs
        .mockResolvedValueOnce([]); // No existing Claude tabs

      await openAllTabsWithInstantFocus(payload);

      expect(mockTabManager.focusTab).not.toHaveBeenCalled();
    });

    it('should handle sites without configs gracefully', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'unknown-site'],
      };

      mockBrowser.tabs.query.mockResolvedValue([createMockTab()]);

      await openAllTabsWithInstantFocus(payload);

      expect(mockTabManager.openOrFocusTab).toHaveBeenCalledTimes(1);
      expect(mockTabManager.openOrFocusTab).toHaveBeenCalledWith(
        mockSites.chatgpt,
        false,
      );
    });

    it('should handle empty sites list gracefully', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: [],
      };

      await openAllTabsWithInstantFocus(payload);

      expect(mockTabManager.openOrFocusTab).not.toHaveBeenCalled();
    });
  });

  describe('sendMessageToSites (private method testing)', () => {
    let sendMessageToSites: any;
    let mockSendToSingleSite: any;

    beforeEach(() => {
      // Access the private method for testing
      sendMessageToSites = (messageHandler as any).sendMessageToSites.bind(
        messageHandler,
      );

      // Mock the private sendToSingleSite method
      mockSendToSingleSite = vi.fn();
      (messageHandler as any).sendToSingleSite = mockSendToSingleSite;
    });

    it('should send to all enabled sites concurrently', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite.mockResolvedValue({ success: true });

      await sendMessageToSites(payload);

      expect(mockSendToSingleSite).toHaveBeenCalledTimes(2);
      expect(mockSendToSingleSite).toHaveBeenCalledWith(
        'chatgpt',
        'Hello world',
      );
      expect(mockSendToSingleSite).toHaveBeenCalledWith(
        'claude',
        'Hello world',
      );
    });

    it('should throw when no enabled sites', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['disabled-site'],
      };

      await expect(sendMessageToSites(payload)).rejects.toThrow(
        'No enabled sites to send message to',
      );
    });

    it('should log warnings for partial failures', async () => {
      const { logger } = await import('../../shared/logger');
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Claude failed'));

      await sendMessageToSites(payload);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Partial message delivery failure'),
      );
    });

    it('should throw detailed error when all sites fail', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite
        .mockRejectedValueOnce(new Error('ChatGPT failed'))
        .mockRejectedValueOnce(new Error('Claude failed'));

      await expect(sendMessageToSites(payload)).rejects.toThrow(
        /All message deliveries failed.*chatgpt.*claude/,
      );
    });

    it('should handle mixed success and failure results', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      mockSendToSingleSite
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Claude failed'));

      // Should not throw for partial success
      await expect(sendMessageToSites(payload)).resolves.toBeUndefined();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle tab manager errors in openAllTabsWithInstantFocus', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt'],
      };

      mockTabManager.openOrFocusTab.mockRejectedValue(
        new Error('Tab operation failed'),
      );
      mockBrowser.tabs.query.mockResolvedValue([createMockTab()]);

      // Should handle gracefully or throw - both are acceptable error handling strategies
      await expect(
        (messageHandler as any).openAllTabsWithInstantFocus(payload),
      ).rejects.toThrow('Tab operation failed');
    });

    it('should handle tab query errors in openAllTabsWithInstantFocus', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt'],
      };

      mockBrowser.tabs.query.mockRejectedValue(new Error('Tab query failed'));

      // Should handle gracefully or throw - both are acceptable error handling strategies
      await expect(
        (messageHandler as any).openAllTabsWithInstantFocus(payload),
      ).rejects.toThrow('Tab query failed');
    });

    it('should handle concurrent site checking correctly', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      // Simulate different timing for tab checking
      mockBrowser.tabs.query
        .mockResolvedValueOnce([createMockTab()]) // Current tab
        .mockImplementationOnce(
          () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
        ) // Slow ChatGPT check
        .mockResolvedValueOnce([]); // Fast Claude check

      await expect(
        (messageHandler as any).openAllTabsWithInstantFocus(payload),
      ).resolves.toBeUndefined();

      expect(mockTabManager.openOrFocusTab).toHaveBeenCalledTimes(2);
    });
  });

  describe('Site URL matching logic', () => {
    it('should correctly identify AI sites by URL prefix', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt'],
      };

      // Test various AI site URLs
      const aiSiteUrls = [
        'https://chat.openai.com',
        'https://chat.openai.com/chat',
        'https://chat.openai.com/g/some-gpt',
      ];

      for (const url of aiSiteUrls) {
        const currentTab = createMockTab({ url });
        mockBrowser.tabs.query
          .mockResolvedValueOnce([currentTab])
          .mockResolvedValueOnce([]);

        await (messageHandler as any).openAllTabsWithInstantFocus(payload);

        // Should not focus new tab since current tab is AI site
        expect(mockTabManager.focusTab).not.toHaveBeenCalled();

        // Reset for next iteration
        vi.clearAllMocks();
        mockTabManager.focusTab = vi.fn();
      }
    });
  });
});
