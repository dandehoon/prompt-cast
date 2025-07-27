import { ChromeMessaging } from '../messaging';
import { EXTENSION_MESSAGE_TYPES, CONTENT_MESSAGE_TYPES } from '../constants';
import { ExtensionMessage } from '../types';

describe('ChromeMessaging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockMessage: ExtensionMessage = {
        type: EXTENSION_MESSAGE_TYPES.SEND_MESSAGE,
        payload: { message: 'test' },
      };
      const mockResponse = { success: true };

      (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ChromeMessaging.sendMessage(mockMessage);

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(mockMessage);
      expect(result).toEqual(mockResponse);
    });

    it('should handle send message failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockMessage: ExtensionMessage = { type: EXTENSION_MESSAGE_TYPES.OPEN_TABS };
      const error = new Error('Send failed');

      (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(error);

      const result = await ChromeMessaging.sendMessage(mockMessage);

      expect(result).toEqual({
        success: false,
        error: 'Send failed',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send message to background script:',
        error,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('sendToTab', () => {
    it('should send message to tab successfully', async () => {
      const tabId = 123;
      const mockMessage = { type: CONTENT_MESSAGE_TYPES.INJECT_MESSAGE };
      const mockResponse = { success: true };

      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const result = await ChromeMessaging.sendToTab(tabId, mockMessage);

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, mockMessage);
      expect(result).toEqual(mockResponse);
    });

    it('should handle send to tab failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const tabId = 123;
      const mockMessage = { type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB };
      const error = new Error('Tab send failed');

      (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(error);

      const result = await ChromeMessaging.sendToTab(tabId, mockMessage);

      expect(result).toEqual({
        success: false,
        error: 'Tab send failed',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send message to tab:',
        error,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('queryTabs', () => {
    it('should query tabs successfully', async () => {
      const mockTabs = [
        { id: 1, url: 'https://chatgpt.com/' },
        { id: 2, url: 'https://claude.ai/' },
      ];
      const queryInfo = { url: '*://*/*' };

      (chrome.tabs.query as jest.Mock).mockResolvedValue(mockTabs);

      const result = await ChromeMessaging.queryTabs(queryInfo);

      expect(chrome.tabs.query).toHaveBeenCalledWith(queryInfo);
      expect(result).toEqual(mockTabs);
    });

    it('should handle query tabs failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const queryInfo = { url: '*://*/*' };
      const error = new Error('Query failed');

      (chrome.tabs.query as jest.Mock).mockRejectedValue(error);

      const result = await ChromeMessaging.queryTabs(queryInfo);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to query tabs:', error);

      consoleSpy.mockRestore();
    });
  });
});
