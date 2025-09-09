import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabManager } from '../../background/tabManager';
import type { SiteConfig } from '../../types/siteConfig';
import type { SiteManager } from '../../background/siteManager';
import { fakeBrowser } from 'wxt/testing';

// Mock specific modules
vi.mock('../../shared/config', () => ({
  CONFIG: {
    background: {
      tab: {
        maxReadyAttempts: 5,
        readyCheckInterval: 100,
      },
      messageRetry: {
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
      },
    },
  },
}));

vi.mock('../../shared/utils', () => ({
  sleep: vi.fn((_ms: number) => Promise.resolve()),
}));

vi.mock('../../shared/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Note: Background messaging removed with executeScript approach

describe('TabManager', () => {
  let tabManager: TabManager;
  let mockSites: Record<string, SiteConfig>;
  let mockSiteManager: SiteManager;
  let mockBrowser: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock sites
    mockSites = {
      chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        enabled: true,
        inputSelectors: ['textarea'],
        submitSelectors: ['button[data-testid="send-button"]'],
        colors: { light: '#10a37f', dark: '#10a37f' },
        injectionMethod: 'execCommand',
        chatUriPatterns: ['/', '/c/*'],
      },
      claude: {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        enabled: true,
        inputSelectors: ['textarea'],
        submitSelectors: ['.send-button'],
        colors: { light: '#cc785c', dark: '#cc785c' },
        injectionMethod: undefined,
        chatUriPatterns: ['/', '/new', '/chat/*'],
      },
      gemini: {
        id: 'gemini',
        name: 'Gemini',
        url: 'https://gemini.google.com/',
        enabled: true,
        inputSelectors: ['div.ql-editor[contenteditable]'],
        submitSelectors: ['button.send-button'],
        colors: { light: '#4285f4', dark: '#4285f4' },
        chatUriPatterns: ['/', '/app', '/app/*'],
      },
    };

    // Get mocked browser from WXT and set up mock functions
    mockBrowser = fakeBrowser;
    mockBrowser.tabs = {
      query: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };
    mockBrowser.windows = {
      update: vi.fn(),
    };
    mockBrowser.scripting = {
      executeScript: vi.fn(),
    };

    // Background messaging removed - using executeScript approach now

    // Create mock SiteManager
    mockSiteManager = {
      getSite: vi.fn((siteId: string) => mockSites[siteId]),
      getSiteValues: vi.fn(() => Object.values(mockSites)),
      getAllSites: vi.fn(() => mockSites),
    } as any;

    tabManager = new TabManager(mockSiteManager);
  });

  function createMockTab(overrides: any = {}) {
    return {
      id: 1,
      url: 'https://chat.openai.com/', // Change to base URL to match chat URI patterns
      title: 'ChatGPT',
      status: 'complete',
      windowId: 100,
      ...overrides,
    };
  }

  describe('openOrFocusTab', () => {
    it('should focus existing tab when found and shouldFocus is true', async () => {
      const existingTab = createMockTab();
      mockBrowser.tabs.query.mockResolvedValue([existingTab]);

      await tabManager.openOrFocusTab(mockSites.chatgpt, true);

      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({
        url: 'https://chat.openai.com*',
        currentWindow: true,
      });
      expect(mockBrowser.tabs.update).toHaveBeenCalledWith(1, { active: true });
      expect(mockBrowser.windows.update).toHaveBeenCalledWith(100, {
        focused: true,
      });
    });

    it('should not focus existing tab when shouldFocus is false', async () => {
      const existingTab = createMockTab();
      mockBrowser.tabs.query.mockResolvedValue([existingTab]);

      await tabManager.openOrFocusTab(mockSites.chatgpt, false);

      expect(mockBrowser.tabs.query).toHaveBeenCalled();
      expect(mockBrowser.tabs.update).not.toHaveBeenCalled();
      expect(mockBrowser.windows.update).not.toHaveBeenCalled();
    });

    it('should create new tab when none exists', async () => {
      // Mock the query for existing tabs
      mockBrowser.tabs.query
        .mockResolvedValueOnce([]) // First call: query for existing tabs
        .mockResolvedValueOnce([createMockTab({ windowId: 100 })]); // Second call: getCurrentWindowId

      const newTab = createMockTab({ id: 2 });
      mockBrowser.tabs.create.mockResolvedValue(newTab);

      await tabManager.openOrFocusTab(mockSites.chatgpt, true);

      expect(mockBrowser.tabs.create).toHaveBeenCalledWith({
        url: 'https://chat.openai.com',
        active: true,
        windowId: 100,
      });
    });
  });

  describe('waitForTabReady', () => {
    it('should return immediately when tab is complete', async () => {
      mockBrowser.tabs.get.mockResolvedValue(
        createMockTab({ status: 'complete', url: 'https://example.com' }),
      );

      const startTime = Date.now();
      await tabManager.waitForTabReady(1);
      const elapsed = Date.now() - startTime;

      expect(mockBrowser.tabs.get).toHaveBeenCalledWith(1);
      expect(elapsed).toBeLessThan(100); // Should be very quick
    });

    it('should retry when tab is loading and then complete', async () => {
      mockBrowser.tabs.get
        .mockResolvedValueOnce(createMockTab({ status: 'loading' }))
        .mockResolvedValueOnce(
          createMockTab({ status: 'complete', url: 'https://example.com' }),
        );

      await tabManager.waitForTabReady(1);

      expect(mockBrowser.tabs.get).toHaveBeenCalledTimes(2);
    });

    it('should timeout if tab never becomes ready', async () => {
      mockBrowser.tabs.get.mockResolvedValue(
        createMockTab({ status: 'loading' }),
      );

      // Mock the private sleep method to avoid actual delays
      const sleepSpy = vi
        .spyOn(tabManager as any, 'sleep')
        .mockResolvedValue(undefined);

      await expect(tabManager.waitForTabReady(1)).rejects.toThrow(
        'Tab 1 did not become ready within timeout',
      );

      sleepSpy.mockRestore();
    }, 15000); // Give it enough time for the actual timeout
  });

  // Test the private isTabInChatContext method via reflection
  describe('isTabInChatContext (via getTabForSite)', () => {
    it('should match base URL when root path pattern is included', async () => {
      mockBrowser.tabs.query.mockResolvedValue([
        createMockTab({ url: 'https://chat.openai.com/' }),
        createMockTab({ url: 'https://chat.openai.com/settings' }),
      ]);

      const result = await (tabManager as any).getTabForSite(mockSites.chatgpt);

      // Should return first tab that matches chat context (base URL)
      expect(result).toBeTruthy();
      expect(result.url).toBe('https://chat.openai.com/');
    });

    it('should match conversation URLs with wildcard patterns', async () => {
      mockBrowser.tabs.query.mockResolvedValue([
        createMockTab({ url: 'https://chat.openai.com/c/abc123-def456' }),
        createMockTab({ url: 'https://chat.openai.com/settings' }),
      ]);

      const result = await (tabManager as any).getTabForSite(mockSites.chatgpt);

      // Should return the conversation tab, not the settings tab
      expect(result).toBeTruthy();
      expect(result.url).toBe('https://chat.openai.com/c/abc123-def456');
    });

    it('should not match non-chat URLs', async () => {
      mockBrowser.tabs.query.mockResolvedValue([
        createMockTab({ url: 'https://chat.openai.com/settings' }),
        createMockTab({ url: 'https://chat.openai.com/help' }),
      ]);

      const result = await (tabManager as any).getTabForSite(mockSites.chatgpt);

      // Should return null as no tabs match chat context
      expect(result).toBeNull();
    });

    it('should handle Claude chat patterns correctly', async () => {
      mockBrowser.tabs.query.mockResolvedValue([
        createMockTab({ url: 'https://claude.ai/new' }),
        createMockTab({ url: 'https://claude.ai/chat/conversation123' }),
        createMockTab({ url: 'https://claude.ai/profile' }),
      ]);

      const result = await (tabManager as any).getTabForSite(mockSites.claude);

      // Should return the first matching chat tab (/new)
      expect(result).toBeTruthy();
      expect(result.url).toBe('https://claude.ai/new');
    });

    it('should handle Gemini app patterns correctly', async () => {
      mockBrowser.tabs.query.mockResolvedValue([
        createMockTab({ url: 'https://gemini.google.com/app/conversation456' }),
        createMockTab({ url: 'https://gemini.google.com/help' }),
      ]);

      const result = await (tabManager as any).getTabForSite(mockSites.gemini);

      // Should return the app conversation tab
      expect(result).toBeTruthy();
      expect(result.url).toBe('https://gemini.google.com/app/conversation456');
    });

    it('should handle sites without chatUriPatterns as fallback', async () => {
      const siteWithoutPatterns = {
        ...mockSites.chatgpt,
        chatUriPatterns: undefined,
      };

      mockBrowser.tabs.query.mockResolvedValue([
        createMockTab({ url: 'https://chat.openai.com/settings' }),
      ]);

      const result = await (tabManager as any).getTabForSite(
        siteWithoutPatterns,
      );

      // Should fall back to basic URL matching
      expect(result).toBeTruthy();
      expect(result.url).toBe('https://chat.openai.com/settings');
    });
  });

  // Content script related tests removed - using executeScript approach now
});
