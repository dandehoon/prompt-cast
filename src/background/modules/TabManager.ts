import { AIService } from '../../shared/types';
import { CONFIG } from '../../shared/config';
import { sleep } from '../../shared/utils';
import { logger } from '../../shared/logger';
import { CONTENT_MESSAGE_TYPES } from '../../shared/constants';
import { ContentMessage } from '../../shared/types';

export class TabManager {
  constructor(private services: Record<string, AIService>) {}

  async openOrFocusTab(service: AIService, shouldFocus = false): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ url: service.url + '*' });

      if (tabs.length > 0) {
        const tab = tabs[0];
        service.tabId = tab.id;
        service.status = 'loading';

        // Focus existing tab if needed
        if (shouldFocus && tab.id) {
          await this.waitForTabReady(tab.id);
          await chrome.tabs.update(tab.id, { active: true });
          await chrome.windows.update(tab.windowId!, { focused: true });
        }
      } else {
        // Create new tab
        const tab = shouldFocus
          ? await chrome.tabs.create({ url: service.url, active: true })
          : await chrome.tabs.create({ url: service.url, active: false });

        service.tabId = tab.id;
        service.status = 'loading';

        if (shouldFocus && tab.id) {
          await this.waitForTabReady(tab.id);
          await chrome.tabs.update(tab.id, { active: true });
          await chrome.windows.update(tab.windowId!, { focused: true });
        }
      }
    } catch (error) {
      logger.error(`Failed to open/focus tab for ${service.name}:`, error);
      service.status = 'error';
    }
  }

  async focusTab(serviceId: string): Promise<void> {
    const service = this.services[serviceId];
    if (!service || !service.enabled) {
      logger.warn(`Cannot focus tab for disabled service: ${serviceId}`);
      return;
    }

    try {
      if (service.status === 'disconnected') {
        await this.openOrFocusTab(service, true);
      } else if (service.tabId) {
        await chrome.tabs.update(service.tabId, { active: true });
        const tab = await chrome.tabs.get(service.tabId);
        if (tab.windowId) {
          await chrome.windows.update(tab.windowId, { focused: true });
        }
      }
    } catch (error) {
      logger.error(`Failed to focus tab for ${service.name}:`, error);
      service.status = 'error';
    }
  }

  async closeTab(serviceId: string): Promise<void> {
    const service = this.services[serviceId];
    if (service && service.tabId) {
      try {
        await chrome.tabs.remove(service.tabId);
        service.tabId = undefined;
        service.status = 'disconnected';
      } catch (error) {
        logger.error(`Failed to close tab for ${service.name}:`, error);
      }
    }
  }

  async closeAllTabs(): Promise<void> {
    const tabIds = Object.values(this.services)
      .filter((service) => service.tabId)
      .map((service) => service.tabId!);

    if (tabIds.length > 0) {
      try {
        await chrome.tabs.remove(tabIds);
        Object.values(this.services).forEach((service) => {
          service.tabId = undefined;
          service.status = 'disconnected';
        });
      } catch (error) {
        logger.error('Failed to close tabs:', error);
        throw error;
      }
    }
  }

  private async waitForTabReady(tabId: number): Promise<void> {
    const { maxReadyAttempts, readyCheckInterval } = CONFIG.background.tab;

    return new Promise((resolve) => {
      let attempts = 0;

      const checkReady = () => {
        attempts++;
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError || !tab) {
            if (attempts < maxReadyAttempts) {
              setTimeout(checkReady, readyCheckInterval);
            } else {
              resolve(); // Proceed anyway
            }
            return;
          }

          if (tab.status === 'complete') {
            resolve();
          } else if (attempts < maxReadyAttempts) {
            setTimeout(checkReady, readyCheckInterval);
          } else {
            resolve(); // Proceed anyway
          }
        });
      };

      checkReady();
    });
  }

  async waitForContentScriptReady(tabId: number): Promise<void> {
    // First wait for tab to be ready
    await this.waitForTabReady(tabId);

    // Then check if content script is responding with optimized timing
    const { maxReadinessAttempts, readinessCheckDelay } =
      CONFIG.background.contentScript;

    for (let attempt = 1; attempt <= maxReadinessAttempts; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: CONTENT_MESSAGE_TYPES.STATUS_CHECK,
        });

        if (response && response.ready) {
          return;
        }

        // If not ready, wait before next attempt
        if (attempt < maxReadinessAttempts) {
          await sleep(readinessCheckDelay);
        }
      } catch {
        // For Gemini and other services that might take longer, try injecting content script manually
        if (attempt === Math.floor(maxReadinessAttempts / 2)) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['dist/content/content.js'],
            });
          } catch (injectError) {
            logger.warn(
              `Failed to manually inject content script for tab ${tabId}:`,
              injectError,
            );
          }
        }

        // Content script might not be loaded yet, wait and retry
        if (attempt < maxReadinessAttempts) {
          await sleep(readinessCheckDelay);
        } else {
          logger.error(
            `Content script failed to respond after ${maxReadinessAttempts} attempts for tab ${tabId}`,
          );
          // Proceed anyway after max attempts - content script might still work
        }
      }
    }
  }

  async sendMessageWithRetry(
    tabId: number,
    message: ContentMessage,
    maxRetries?: number,
  ): Promise<void> {
    const {
      maxRetries: defaultMaxRetries,
      baseDelay,
      maxDelay,
    } = CONFIG.background.messageRetry;
    const retryCount = maxRetries ?? defaultMaxRetries;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await chrome.tabs.sendMessage(tabId, message);
        return; // Success
      } catch (error) {
        if (attempt < retryCount) {
          // Wait before retry, with exponential backoff
          const delay = Math.min(attempt * baseDelay, maxDelay);
          await sleep(delay);
        } else {
          throw error; // Final attempt failed
        }
      }
    }
  }
}
