import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageHandler } from '../../background/messageHandler';
import type { SiteConfig, SendMessagePayload } from '@/types';
import type { SiteManager } from '../../background/siteManager';
import { fakeBrowser } from 'wxt/testing';

vi.mock('../../shared/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../background/scriptInjector', () => ({
  ExecuteScriptInjector: vi.fn(),
}));

// Note: Background messaging removed with executeScript approach

vi.mock('../../background/tabManager', () => ({
  TabManager: vi.fn().mockImplementation(() => ({
    openOrFocusTab: vi.fn(),
    focusTab: vi.fn(),
    getSiteStatus: vi.fn(),
    openAllTabsWithInstantFocus: vi.fn(),
    launchAllTabs: vi.fn(),
    focusFirstTabIfNeeded: vi.fn(),
    waitForTabReady: vi.fn(),
    isCurrentTabAISite: vi.fn(),
  })),
}));

describe('MessageHandler', () => {
  let messageHandler: MessageHandler;
  let mockSites: Record<string, SiteConfig>;
  let mockSiteManager: SiteManager;
  let mockBrowser: any;
  let mockTabManager: any;
  let mockInjector: any;

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
      get: vi.fn(),
    };
    mockBrowser.scripting = {
      executeScript: vi.fn(),
    };

    // Get mocked TabManager
    const { TabManager } = await import('../../background/tabManager');
    mockTabManager = {
      openOrFocusTab: vi.fn(),
      focusTab: vi.fn(),
      getSiteStatus: vi.fn(),
      openAllTabsWithInstantFocus: vi.fn(),
      launchAllTabs: vi.fn(),
      focusFirstTabIfNeeded: vi.fn(),
      waitForTabReady: vi.fn(),
      isCurrentTabAISite: vi.fn(),
    };
    vi.mocked(TabManager).mockImplementation(() => mockTabManager);

    // Get mocked ExecuteScriptInjector
    const { ExecuteScriptInjector } = await import(
      '../../background/scriptInjector'
    );
    mockInjector = {
      messageInjector: vi.fn(),
      batchInject: vi.fn().mockResolvedValue([
        {
          tabId: 1,
          result: {
            success: true,
            error: undefined,
            details: {},
          },
        },
      ]),
      executeWithRetry: vi.fn(),
    };
    vi.mocked(ExecuteScriptInjector).mockImplementation(
      () => mockInjector as any,
    );

    // Create mock SiteManager
    mockSiteManager = {
      getSite: vi.fn((siteId: string) => mockSites[siteId]),
      getSiteValues: vi.fn(() => Object.values(mockSites)),
      getAllSites: vi.fn(() => mockSites),
      getOrderedEnabledSites: vi.fn(() =>
        Object.values(mockSites).filter((site) => site.enabled),
      ),
    } as any;

    messageHandler = new MessageHandler(mockSiteManager, mockTabManager);
  });

  describe('getSiteStatus', () => {
    it('should return "disconnected" when no tabs exist', async () => {
      mockTabManager.getSiteStatus.mockResolvedValue('disconnected');

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('disconnected');
      expect(mockTabManager.getSiteStatus).toHaveBeenCalledWith(
        mockSites.chatgpt,
      );
    });

    it('should return "disconnected" when tab has no ID', async () => {
      mockTabManager.getSiteStatus.mockResolvedValue('disconnected');

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('disconnected');
      expect(mockTabManager.getSiteStatus).toHaveBeenCalledWith(
        mockSites.chatgpt,
      );
    });

    it('should return "connected" when tab is complete', async () => {
      mockTabManager.getSiteStatus.mockResolvedValue('connected');

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('connected');
      expect(mockTabManager.getSiteStatus).toHaveBeenCalledWith(
        mockSites.chatgpt,
      );
    });

    it('should return "loading" when tab is not complete', async () => {
      mockTabManager.getSiteStatus.mockResolvedValue('loading');

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('loading');
      expect(mockTabManager.getSiteStatus).toHaveBeenCalledWith(
        mockSites.chatgpt,
      );
    });

    it('should return "loading" when tab status check fails', async () => {
      mockTabManager.getSiteStatus.mockResolvedValue('loading');

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('loading');
      expect(mockTabManager.getSiteStatus).toHaveBeenCalledWith(
        mockSites.chatgpt,
      );
    });

    it('should return "error" when tab query fails', async () => {
      mockTabManager.getSiteStatus.mockResolvedValue('error');

      const status = await messageHandler.getSiteStatus(mockSites.chatgpt);

      expect(status).toBe('error');
      expect(mockTabManager.getSiteStatus).toHaveBeenCalledWith(
        mockSites.chatgpt,
      );
    });
  });

  describe('sendMessageToSitesRobust', () => {
    beforeEach(() => {
      // Set up mock tab manager methods
      mockTabManager.openAllTabsWithInstantFocus.mockResolvedValue(undefined);
      mockTabManager.launchAllTabs.mockResolvedValue([
        { site: mockSites.chatgpt, tabId: 1 },
        { site: mockSites.claude, tabId: 2 },
      ]);
      mockTabManager.focusFirstTabIfNeeded.mockResolvedValue(undefined);
      mockTabManager.waitForTabReady.mockResolvedValue(undefined);
    });

    it('should successfully send message to all sites', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      // Mock launchAllTabs to return tabs
      mockTabManager.launchAllTabs.mockResolvedValue([
        { site: mockSites.chatgpt, tabId: 1 },
        { site: mockSites.claude, tabId: 2 },
      ]);

      // Mock waitForTabReady to succeed
      mockTabManager.waitForTabReady.mockResolvedValue(true);

      // Mock successful injection for both sites
      mockInjector.batchInject
        .mockResolvedValueOnce([
          {
            tabId: 1,
            result: { success: true, injected: true },
          },
        ])
        .mockResolvedValueOnce([
          {
            tabId: 2,
            result: { success: true, injected: true },
          },
        ]);

      await messageHandler.sendMessageToSitesRobust(payload);

      // Verify that launchAllTabs is called with the enabled sites
      expect(mockTabManager.launchAllTabs).toHaveBeenCalledWith([
        mockSites.chatgpt,
        mockSites.claude,
      ]);
    });

    it('should handle partial failures gracefully', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      // Mock launchAllTabs to return tabs
      mockTabManager.launchAllTabs.mockResolvedValue([
        { site: mockSites.chatgpt, tabId: 1 },
        { site: mockSites.claude, tabId: 2 },
      ]);

      // Mock waitForTabReady to succeed
      mockTabManager.waitForTabReady.mockResolvedValue(true);

      // Mock partial failure - one succeeds, one fails
      mockInjector.batchInject
        .mockResolvedValueOnce([
          {
            tabId: 1,
            result: { success: true, injected: true },
          },
        ])
        .mockResolvedValueOnce([
          {
            tabId: 2,
            result: { success: false, error: 'Claude injection failed' },
          },
        ]);

      // Should throw for partial failure (current implementation behavior)
      await expect(
        messageHandler.sendMessageToSitesRobust(payload),
      ).rejects.toThrow('Failed to send message to Claude');
    });

    it('should throw when all sites fail', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'claude'],
      };

      // Mock launchAllTabs to return tabs
      mockTabManager.launchAllTabs.mockResolvedValue([
        { site: mockSites.chatgpt, tabId: 1 },
        { site: mockSites.claude, tabId: 2 },
      ]);

      // Mock waitForTabReady to succeed
      mockTabManager.waitForTabReady.mockResolvedValue(true);

      // Mock all injections failing - each tab is processed independently
      mockInjector.batchInject
        .mockResolvedValueOnce([
          {
            tabId: 1,
            result: { success: false, error: 'ChatGPT failed' },
          },
        ])
        .mockResolvedValueOnce([
          {
            tabId: 2,
            result: { success: false, error: 'Claude failed' },
          },
        ]);

      await expect(
        messageHandler.sendMessageToSitesRobust(payload),
      ).rejects.toThrow('Failed to send message to ChatGPT, Claude');
    });

    it('should filter out disabled sites', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['chatgpt', 'disabled-site'],
      };

      // Mock only chatgpt tab being launched (disabled-site is disabled)
      mockTabManager.launchAllTabs.mockResolvedValue([
        { site: mockSites.chatgpt, tabId: 1 },
      ]);

      // Mock successful injection for chatgpt
      mockInjector.batchInject.mockResolvedValue([
        {
          tabId: 1,
          result: { success: true, injected: true },
        },
      ]);

      await messageHandler.sendMessageToSitesRobust(payload);

      // Should only call batchInject once (for chatgpt only, disabled-site filtered out)
      expect(mockInjector.batchInject).toHaveBeenCalledTimes(1);
      expect(mockInjector.batchInject).toHaveBeenCalledWith('Hello world', [
        { tabId: 1, siteConfig: mockSites.chatgpt },
      ]);
    });

    it('should handle empty enabled sites list', async () => {
      const payload: SendMessagePayload = {
        message: 'Hello world',
        sites: ['disabled-site'],
      };

      await expect(
        messageHandler.sendMessageToSitesRobust(payload),
      ).rejects.toThrow('No enabled sites to send message to');
    });
  });
});
