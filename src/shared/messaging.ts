import type { ExtensionMessage, ContentMessage, Response } from '../types';
import { logger } from './logger';

export class ChromeMessaging {
  /**
   * Send message to background script and wait for response
   */
  static async sendMessage<T = unknown>(
    message: ExtensionMessage,
  ): Promise<Response<T>> {
    try {
      const response = await chrome.runtime.sendMessage(message);
      return response;
    } catch (error) {
      logger.error('Failed to send message to background script:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send message to content script in specific tab
   */
  static async sendToTab<T = unknown>(
    tabId: number,
    message: ContentMessage,
  ): Promise<Response<T>> {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response;
    } catch (error) {
      logger.error('Failed to send message to tab:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Query Chrome tabs
   */
  static async queryTabs(
    queryInfo: chrome.tabs.QueryInfo,
  ): Promise<chrome.tabs.Tab[]> {
    try {
      return await chrome.tabs.query(queryInfo);
    } catch (error) {
      logger.error('Failed to query tabs:', error);
      return [];
    }
  }
}
