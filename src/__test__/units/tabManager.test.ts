import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type MockedFunction,
} from 'vitest';
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
      contentScript: {
        maxReadinessAttempts: 10,
        readinessCheckDelay: 200,
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

vi.mock('../../background/messaging', () => ({
  BackgroundMessaging: {
    isContentScriptReady: vi.fn(),
    sendToTab: vi.fn(),
  },
}));

describe('TabManager', () => {
  let tabManager: TabManager;
  let mockSites: Record<string, SiteConfig>;
  let mockBrowser: any;
  let mockBackgroundMessaging: any;
  let mockSleep: MockedFunction<any>;

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

    // Get mocked utilities
    const { sleep } = await import('../../shared/utils');
    mockSleep = sleep as MockedFunction<any>;

    const { BackgroundMessaging } = await import('../../background/messaging');
    mockBackgroundMessaging = BackgroundMessaging;

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

  describe('waitForContentScriptReady', () => {
    it('should return immediately when content script is ready', async () => {
      mockBrowser.tabs.get.mockResolvedValue(
        createMockTab({ status: 'complete' }),
      );
      mockBackgroundMessaging.isContentScriptReady.mockResolvedValue(true);

      await tabManager.waitForContentScriptReady(1);

      expect(mockBackgroundMessaging.isContentScriptReady).toHaveBeenCalledWith(
        1,
      );
    });

    it('should retry until content script is ready', async () => {
      mockBrowser.tabs.get.mockResolvedValue(
        createMockTab({ status: 'complete' }),
      );
      mockBackgroundMessaging.isContentScriptReady
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await tabManager.waitForContentScriptReady(1);

      expect(
        mockBackgroundMessaging.isContentScriptReady,
      ).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendMessageWithRetry', () => {
    it('should send message successfully on first attempt', async () => {
      const mockResponse = { success: true };
      mockBackgroundMessaging.sendToTab.mockResolvedValue(mockResponse);

      const result = await tabManager.sendMessageWithRetry(
        1,
        'INJECT_MESSAGE',
        { message: 'test' },
      );

      expect(result).toEqual(mockResponse);
      expect(mockBackgroundMessaging.sendToTab).toHaveBeenCalledTimes(1);
    });

    it('should implement exponential backoff with max delay', async () => {
      const error = new Error('Failure');
      mockBackgroundMessaging.sendToTab.mockRejectedValue(error);

      await expect(
        tabManager.sendMessageWithRetry(1, 'INJECT_MESSAGE', {
          message: 'test',
        }),
      ).rejects.toThrow();

      // Should have slept between retries
      expect(mockSleep).toHaveBeenCalledWith(100); // First retry: 1 * 100
      expect(mockSleep).toHaveBeenCalledWith(200); // Second retry: 2 * 100
    });
  });
});
