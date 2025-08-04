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
    // Only open tabs for sites that are both enabled and requested for this message
    const sitesToOpen = payload.sites.filter(
      (siteId) => this.sites[siteId]?.enabled,
    );

    let focusApplied = false;

    // Check if any AI site tab is already active/focused
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (currentTab[0]) {
      const currentUrl = currentTab[0].url || '';
      // Check if current tab belongs to any AI site that's in the enabled list for this message
      for (const siteId of sitesToOpen) {
        const site = this.sites[siteId];
        if (
          site &&
          site.enabled &&
          currentUrl.includes(site.url.split('/')[2])
        ) {
          focusApplied = true;
          break;
        }
      }
    }

    // Open only the required tabs concurrently, but focus the first one immediately
    const openPromises = sitesToOpen.map(async (siteId) => {
      const site = this.sites[siteId];
      if (!site) return;

      await this.tabManager.openOrFocusTab(site, false);

      // Focus the first available site immediately after it opens (if no current focus)
      if (!focusApplied) {
        await this.tabManager.focusTab(siteId);
        focusApplied = true;
      }
    });

    // Wait for all to complete
    await Promise.allSettled(openPromises);
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
