import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabManager } from '../../background/tabManager';
import type { SiteConfig } from '../../types/siteConfig';
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

    tabManager = new TabManager(mockSites);
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

  describe('openOrFocusTab', () => {
    it('should focus existing tab when found and shouldFocus is true', async () => {
      const existingTab = createMockTab();
      mockBrowser.tabs.query.mockResolvedValue([existingTab]);

      await tabManager.openOrFocusTab(mockSites.chatgpt, true);

      expect(mockBrowser.tabs.query).toHaveBeenCalledWith({
        url: 'https://chat.openai.com*',
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
      mockBrowser.tabs.query.mockResolvedValue([]);
      const newTab = createMockTab({ id: 2 });
      mockBrowser.tabs.create.mockResolvedValue(newTab);

      await tabManager.openOrFocusTab(mockSites.chatgpt, true);

      expect(mockBrowser.tabs.create).toHaveBeenCalledWith({
        url: 'https://chat.openai.com',
        active: true,
      });
    });
  });

  describe('waitForTabReady', () => {
    it('should return immediately when tab is ready', async () => {
      mockBrowser.tabs.get.mockResolvedValue(
        createMockTab({ status: 'complete' }),
      );

      await tabManager.waitForTabReady(1);

      expect(mockBrowser.tabs.get).toHaveBeenCalledWith(1);
    });

    it('should retry until tab is ready', async () => {
      mockBrowser.tabs.get
        .mockResolvedValueOnce(createMockTab({ status: 'loading' }))
        .mockResolvedValueOnce(createMockTab({ status: 'complete' }));

      await tabManager.waitForTabReady(1);

      expect(mockBrowser.tabs.get).toHaveBeenCalledTimes(2);
    });
  });

  // Content script related tests removed - using executeScript approach now
});
