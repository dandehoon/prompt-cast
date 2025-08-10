import { browser } from '#imports';
import { sendToContent } from '../content/messaging';
import { logger } from '../shared/logger';

/**
 * Background-specific messaging utilities
 * Handles communication with content scripts using webext-core
 */
export class BackgroundMessaging {
  /**
   * Send message to content script with retry logic
   */
  static async sendToTab<T = unknown>(
    tabId: number,
    messageType: keyof import('../content/messaging').ContentProtocolMap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use webext-core messaging with tab targeting
        const response = await sendToContent(messageType, data, tabId);
        return response as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(attempt * 200, 1000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`All ${maxRetries} attempts failed for tab ${tabId}`);
    throw lastError || new Error('Failed to send message after all retries');
  }

  /**
   * Check if content script is ready in a specific tab
   */
  static async isContentScriptReady(tabId: number): Promise<boolean> {
    try {
      const response = await this.sendToTab<{ ready: boolean }>(
        tabId,
        'STATUS_CHECK',
      );
      return response?.ready ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Inject message into tab with proper error handling
   */
  static async injectMessage(
    tabId: number,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.sendToTab(tabId, 'INJECT_MESSAGE', {
        message,
      });
      return response as { success: boolean; error?: string };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Query browser tabs using WXT browser API
   */
  static async queryTabs(
    queryInfo: Parameters<typeof browser.tabs.query>[0],
  ): Promise<ReturnType<typeof browser.tabs.query>> {
    try {
      return await browser.tabs.query(queryInfo);
    } catch (error) {
      logger.error('Failed to query tabs:', error);
      return [];
    }
  }
}
