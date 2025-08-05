import type { SiteConfig } from '../../types/site';
import { CONFIG } from '../../shared/config';
import { sleep } from '../../shared/utils';
import { logger } from '../../shared/logger';
import { CONTENT_MESSAGE_TYPES } from '../../shared/constants';
import type { ContentMessage } from '../../types/messages';

export class TabManager {
  constructor(private sites: Record<string, SiteConfig>) {}

  /**
   * Get current tab for a site by querying Chrome directly (no cached state)
   */
  private async getTabForSite(
    site: SiteConfig,
  ): Promise<chrome.tabs.Tab | null> {
    try {
      const tabs = await chrome.tabs.query({ url: site.url + '*' });
      return tabs.length > 0 ? tabs[0] : null;
    } catch (error) {
      logger.error(`Failed to query tabs for ${site.name}:`, error);
      return null;
    }
  }

  /**
   * Get all AI site tabs currently open
   */
  private async getAllSiteTabs(): Promise<chrome.tabs.Tab[]> {
    try {
      const allTabs = await chrome.tabs.query({});
      return allTabs.filter((tab) =>
        Object.values(this.sites).some(
          (site) => tab.url && tab.url.startsWith(site.url),
        ),
      );
    } catch (error) {
      logger.error('Failed to query all AI site tabs:', error);
      return [];
    }
  }

  async openOrFocusTab(site: SiteConfig, shouldFocus = false): Promise<void> {
    try {
      const existingTab = await this.getTabForSite(site);

      if (existingTab?.id) {
        // Tab exists, focus if needed
        if (shouldFocus) {
          await chrome.tabs.update(existingTab.id, { active: true });
          if (existingTab.windowId) {
            await chrome.windows.update(existingTab.windowId, {
              focused: true,
            });
          }
        }
      } else {
        // Create new tab
        const newTab = await chrome.tabs.create({
          url: site.url,
          active: shouldFocus,
        });

        if (shouldFocus && newTab.id) {
          await this.waitForTabReady(newTab.id);
        }
      }
    } catch (error) {
      logger.error(`Failed to open/focus tab for ${site.name}:`, error);
    }
  }

  async focusTab(siteId: string): Promise<void> {
    const site = this.sites[siteId];
    if (!site || !site.enabled) {
      logger.warn(`Cannot focus tab for disabled site: ${siteId}`);
      return;
    }

    const existingTab = await this.getTabForSite(site);

    if (existingTab?.id) {
      // Tab exists, focus it
      await chrome.tabs.update(existingTab.id, { active: true });
      if (existingTab.windowId) {
        await chrome.windows.update(existingTab.windowId, { focused: true });
      }
    } else {
      // No tab exists, create and focus
      await this.openOrFocusTab(site, true);
    }
  }

  async closeTab(siteId: string): Promise<void> {
    const site = this.sites[siteId];
    if (!site) return;

    const existingTab = await this.getTabForSite(site);
    if (existingTab?.id) {
      try {
        await chrome.tabs.remove(existingTab.id);
      } catch (error) {
        logger.error(`Failed to close tab for ${site.name}:`, error);
      }
    }
  }

  async closeAllTabs(): Promise<void> {
    try {
      const siteTabs = await this.getAllSiteTabs();
      const tabIds = siteTabs
        .map((tab) => tab.id)
        .filter((id): id is number => id !== undefined);

      if (tabIds.length > 0) {
        await chrome.tabs.remove(tabIds);
      }
    } catch (error) {
      logger.error('Failed to close all tabs:', error);
      throw error;
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
        // For Gemini and other sites that might take longer, try injecting content script manually
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
