import { TabManager } from '../TabManager';
import { AISite } from '../../../shared/types';
import { logger } from '../../../shared/logger';

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    sendMessage: jest.fn(),
  },
  windows: {
    update: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
};

// @ts-expect-error - Mock chrome global
global.chrome = mockChrome;

// Mock logger
jest.mock('../../../shared/logger');
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('TabManager', () => {
  let sites: Record<string, AISite>;
  let tabManager: TabManager;

  beforeEach(() => {
    jest.clearAllMocks();
    sites = {
      chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        url: 'https://chat.openai.com',
        enabled: true,
        status: 'connected',
        tabId: 1,
      },
      claude: {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        enabled: true,
        status: 'connected',
        tabId: 2,
      },
      gemini: {
        id: 'gemini',
        name: 'Gemini',
        url: 'https://gemini.google.com',
        enabled: false,
        status: 'disconnected',
        tabId: undefined,
      },
    };
    tabManager = new TabManager(sites);
  });

  describe('closeAllTabs', () => {
    it('should close all tabs with valid tabIds', async () => {
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      expect(mockChrome.tabs.remove).toHaveBeenCalledWith([1, 2]);
      expect(sites.chatgpt.tabId).toBeUndefined();
      expect(sites.chatgpt.status).toBe('disconnected');
      expect(sites.claude.tabId).toBeUndefined();
      expect(sites.claude.status).toBe('disconnected');
      expect(sites.gemini.tabId).toBeUndefined(); // Should remain undefined
    });

    it('should handle sites with undefined tabIds', async () => {
      sites.chatgpt.tabId = undefined;
      sites.claude.tabId = null as any; // Test null values too
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      // Should not call remove since no valid tabIds
      expect(mockChrome.tabs.remove).not.toHaveBeenCalled();
    });

    it('should handle mixed valid and invalid tabIds', async () => {
      sites.chatgpt.tabId = 1;
      sites.claude.tabId = undefined;
      sites.gemini.tabId = 3;
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      expect(mockChrome.tabs.remove).toHaveBeenCalledWith([1, 3]);
      expect(sites.chatgpt.tabId).toBeUndefined();
      expect(sites.chatgpt.status).toBe('disconnected');
      expect(sites.gemini.tabId).toBeUndefined();
      expect(sites.gemini.status).toBe('disconnected');
      // Claude should remain unchanged since it had no tabId
      expect(sites.claude.tabId).toBeUndefined();
    });

    it('should only update sites that were actually closed', async () => {
      sites.chatgpt.tabId = 1;
      sites.claude.tabId = 2;
      sites.gemini.tabId = 3;

      // Mock chrome.tabs.remove to succeed
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      // All sites with tabIds should be updated
      expect(sites.chatgpt.tabId).toBeUndefined();
      expect(sites.chatgpt.status).toBe('disconnected');
      expect(sites.claude.tabId).toBeUndefined();
      expect(sites.claude.status).toBe('disconnected');
      expect(sites.gemini.tabId).toBeUndefined();
      expect(sites.gemini.status).toBe('disconnected');
    });

    it('should handle chrome.tabs.remove error', async () => {
      const error = new Error('Failed to close tabs');
      mockChrome.tabs.remove.mockRejectedValue(error);

      await expect(tabManager.closeAllTabs()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to close tabs:',
        error,
      );
    });

    it('should handle non-numeric tabId values', async () => {
      sites.chatgpt.tabId = 'invalid' as any;
      sites.claude.tabId = 2;
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      // Should only include valid numeric tabIds
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith([2]);
    });
  });
});
