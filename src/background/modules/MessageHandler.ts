import { SendMessagePayload, AISite } from '../../shared/types';
import { logger } from '../../shared/logger';
import { CONTENT_MESSAGE_TYPES } from '../../shared/constants';
import { TabManager } from './TabManager';

export class MessageHandler {
  constructor(
    private sites: Record<string, AISite>,
    private tabManager: TabManager,
  ) {}

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
      if (!focusApplied && site.tabId) {
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
        site.tabId = tab.id;

        // Wait for tab to be fully loaded and content script ready
        await this.tabManager.waitForContentScriptReady(tab.id!);

        // Try to send message with retry logic
        await this.tabManager.sendMessageWithRetry(tab.id!, {
          type: CONTENT_MESSAGE_TYPES.INJECT_MESSAGE,
          payload: { message },
        });

        site.status = 'connected';
      } else {
        site.status = 'disconnected';
        site.tabId = undefined;
        throw new Error(`Failed to open or find ${site.name} tab`);
      }
    } catch (error) {
      logger.error(`Failed to send message to ${site.name}:`, error);
      site.status = 'error';
      site.tabId = undefined;
      throw error;
    }
  }
}
