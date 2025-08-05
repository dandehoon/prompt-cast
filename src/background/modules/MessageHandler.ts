import type {
  SendMessagePayload,
  SiteConfig,
  SiteStatusType,
} from '../../types';
import { logger } from '../../shared/logger';
import { CONTENT_MESSAGE_TYPES } from '../../shared/constants';
import { TabManager } from './TabManager';

export class MessageHandler {
  constructor(
    private sites: Record<string, SiteConfig>,
    private tabManager: TabManager,
  ) {}

  /**
   * Get current status for a site by checking if its tab exists and responds
   */
  async getSiteStatus(site: SiteConfig): Promise<SiteStatusType> {
    try {
      const tabs = await chrome.tabs.query({ url: site.url + '*' });

      if (tabs.length === 0) {
        return 'disconnected';
      }

      const tab = tabs[0];
      if (!tab.id) {
        return 'disconnected';
      }

      // Check if content script is ready
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: CONTENT_MESSAGE_TYPES.STATUS_CHECK,
        });

        return response && response.ready ? 'connected' : 'loading';
      } catch {
        return 'loading'; // Tab exists but content script not ready
      }
    } catch (error) {
      logger.error(`Failed to get status for ${site.name}:`, error);
      return 'error';
    }
  }

  async sendMessageToSitesRobust(payload: SendMessagePayload): Promise<void> {
    // First, ensure all tabs are open and ready
    await this.openAllTabsWithInstantFocus(payload);

    // Remove hardcoded delays - let content script readiness detection handle timing
    // Now send messages to all sites immediately
    await this.sendMessageToSites(payload);
  }

  private async openAllTabsWithInstantFocus(
    payload: SendMessagePayload,
  ): Promise<void> {
    const sitesToOpen = payload.sites.filter(
      (siteId) => this.sites[siteId]?.enabled,
    );

    if (sitesToOpen.length === 0) return;

    // Check if any AI site tab is currently active
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const isCurrentTabAISite =
      currentTab[0] &&
      sitesToOpen.some((siteId) => {
        const site = this.sites[siteId];
        return site && currentTab[0].url?.includes(site.url.split('/')[2]);
      });

    // Open all tabs and track the first new one
    let firstNewTabSite: string | null = null;

    for (const siteId of sitesToOpen) {
      const site = this.sites[siteId];
      if (!site) continue;

      const existingTabs = await chrome.tabs.query({ url: site.url + '*' });
      const isNewTab = existingTabs.length === 0;

      await this.tabManager.openOrFocusTab(site, false);

      if (isNewTab && !firstNewTabSite) {
        firstNewTabSite = siteId;
      }
    }

    // Focus the first new tab if no AI site is currently active
    if (!isCurrentTabAISite && firstNewTabSite) {
      await this.tabManager.focusTab(firstNewTabSite);
    }
  }

  private async sendMessageToSites(payload: SendMessagePayload): Promise<void> {
    const enabledSites = payload.sites.filter(
      (siteId) => this.sites[siteId]?.enabled,
    );

    // Process all sites concurrently
    const sendPromises = enabledSites.map((siteId) =>
      this.sendToSingleSite(siteId, payload.message),
    );

    // Wait for all to complete
    const results = await Promise.allSettled(sendPromises);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const siteId = enabledSites[index];
        logger.error(`Failed to send message to ${siteId}:`, result.reason);
      }
    });
  }

  private async sendToSingleSite(
    siteId: string,
    message: string,
  ): Promise<void> {
    const site = this.sites[siteId];

    try {
      // First, try to find current tabs for this site
      let tabs = await chrome.tabs.query({ url: site.url + '*' });

      // If no tabs exist, open one first
      if (tabs.length === 0) {
        await this.tabManager.openOrFocusTab(site, false);
        // Query again after opening
        tabs = await chrome.tabs.query({ url: site.url + '*' });
      }

      if (tabs.length > 0) {
        const tab = tabs[0];

        // Wait for tab to be fully loaded and content script ready
        await this.tabManager.waitForContentScriptReady(tab.id!);

        // Try to send message with retry logic
        await this.tabManager.sendMessageWithRetry(tab.id!, {
          type: CONTENT_MESSAGE_TYPES.INJECT_MESSAGE,
          payload: { message },
        });
      } else {
        throw new Error(`Failed to open or find ${site.name} tab`);
      }
    } catch (error) {
      logger.error(`Failed to send message to ${site.name}:`, error);
      throw error;
    }
  }
}
