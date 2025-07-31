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
      },
      claude: {
        id: 'claude',
        name: 'Claude',
        url: 'https://claude.ai',
        enabled: true,
      },
      gemini: {
        id: 'gemini',
        name: 'Gemini',
        url: 'https://gemini.google.com',
        enabled: false,
      },
    };
    tabManager = new TabManager(sites);
  });

  describe('closeAllTabs', () => {
    it('should close all AI site tabs currently open', async () => {
      // Mock chrome.tabs.query to return AI site tabs
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1, url: 'https://chat.openai.com/chat' },
        { id: 2, url: 'https://claude.ai/chat' },
        { id: 3, url: 'https://google.com' }, // Non-AI site
      ]);
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({});
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith([1, 2]);
    });

    it('should handle no open AI site tabs', async () => {
      // Mock chrome.tabs.query to return no AI site tabs
      mockChrome.tabs.query.mockResolvedValue([
        { id: 3, url: 'https://google.com' }, // Non-AI site
      ]);
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({});
      // Should not call remove since no AI tabs
      expect(mockChrome.tabs.remove).not.toHaveBeenCalled();
    });

    it('should handle chrome.tabs.remove error', async () => {
      // Mock chrome.tabs.query to return AI site tabs
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1, url: 'https://chat.openai.com/chat' },
        { id: 2, url: 'https://claude.ai/chat' },
      ]);
      const error = new Error('Failed to close tabs');
      mockChrome.tabs.remove.mockRejectedValue(error);

      await expect(tabManager.closeAllTabs()).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to close all tabs:',
        error,
      );
    });

    it('should handle tabs without valid IDs', async () => {
      // Mock chrome.tabs.query to return tabs with undefined ids
      mockChrome.tabs.query.mockResolvedValue([
        { id: undefined, url: 'https://chat.openai.com/chat' },
        { id: 2, url: 'https://claude.ai/chat' },
      ]);
      mockChrome.tabs.remove.mockResolvedValue(undefined);

      await tabManager.closeAllTabs();

      // Should only include valid tabIds
      expect(mockChrome.tabs.remove).toHaveBeenCalledWith([2]);
    });

    it('should handle chrome.tabs.query error', async () => {
      const error = new Error('Failed to query tabs');
      mockChrome.tabs.query.mockRejectedValue(error);

      // The method should catch the error and log it, but not throw it
      await tabManager.closeAllTabs();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to query all AI site tabs:',
        error,
      );
    });
  });

  describe('openOrFocusTab', () => {
    it('should focus existing tab when shouldFocus is true', async () => {
      const site = sites.chatgpt;
      mockChrome.tabs.query.mockResolvedValue([
        { id: 1, url: 'https://chat.openai.com/chat', windowId: 100 },
      ]);
      mockChrome.tabs.update.mockResolvedValue({});
      mockChrome.windows.update.mockResolvedValue({});

      await tabManager.openOrFocusTab(site, true);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        url: site.url + '*',
      });
      expect(mockChrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
      expect(mockChrome.windows.update).toHaveBeenCalledWith(100, {
        focused: true,
      });
    });

    it('should create new tab when none exists', async () => {
      const site = sites.chatgpt;
      mockChrome.tabs.query.mockResolvedValue([]); // No existing tabs
      mockChrome.tabs.create.mockResolvedValue({ id: 2, url: site.url });

      await tabManager.openOrFocusTab(site, false);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({
        url: site.url + '*',
      });
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: site.url,
        active: false,
      });
    });

    it('should handle Chrome API errors gracefully', async () => {
      const site = sites.chatgpt;
      const error = new Error('Chrome API failed');
      mockChrome.tabs.query.mockRejectedValue(error);

      await tabManager.openOrFocusTab(site, false);

      expect(mockLogger.error).toHaveBeenCalledWith(
        `Failed to query tabs for ${site.name}:`,
        error,
      );
    });
  });
});
