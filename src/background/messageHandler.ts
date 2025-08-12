import { browser } from '#imports';
import type { SendMessagePayload, SiteConfig } from '@/types';
import type { SiteStatusType } from '@/shared';
import { logger } from '@/shared';
import { TabManager } from './tabManager';
import { ExecuteScriptInjector } from './executeScriptInjector';
import type { BatchInjectionConfig } from './injections';

export class MessageHandler {
  private injector: ExecuteScriptInjector;

  constructor(
    private sites: Record<string, SiteConfig>,
    private tabManager: TabManager,
  ) {
    this.injector = new ExecuteScriptInjector();
  }

  /**
   * Update the sites configuration without recreating the handler
   */
  updateSites(newSites: Record<string, SiteConfig>): void {
    this.sites = newSites;
  }

  /**
   * Get current status for a site by checking if its tab exists
   * With executeScript approach, we don't need to check content script readiness
   */
  async getSiteStatus(site: SiteConfig): Promise<SiteStatusType> {
    try {
      const tabs = await browser.tabs.query({ url: site.url + '*' });

      if (tabs.length === 0) {
        return 'disconnected';
      }

      const tab = tabs[0];
      if (!tab.id) {
        return 'disconnected';
      }

      // With executeScript, if tab exists and is loaded, we can inject
      if (tab.status === 'complete') {
        return 'connected';
      } else {
        return 'loading';
      }
    } catch (error) {
      logger.error(`Failed to get status for ${site.name}:`, error);
      return 'error';
    }
  }

  async sendMessageToSitesRobust(payload: SendMessagePayload): Promise<void> {
    try {
      // First, ensure all tabs are open and ready
      await this.openAllTabsWithInstantFocus(payload);

      // Then send messages to all sites with better error handling
      await this.sendMessageToSites(payload);
    } catch (error) {
      logger.error('Message delivery failed:', error);
      throw new Error(
        `Failed to deliver message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  private async openAllTabsWithInstantFocus(
    payload: SendMessagePayload,
  ): Promise<void> {
    const sitesToOpen = payload.sites.filter(
      (siteId) => this.sites[siteId]?.enabled,
    );

    if (sitesToOpen.length === 0) return;

    // Check if any AI site tab is currently active
    const currentTab = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const isCurrentTabAISite =
      currentTab[0] &&
      sitesToOpen.some((siteId) => {
        const site = this.sites[siteId];
        if (!site) return false;

        const tabUrl = currentTab[0].url || '';
        const siteHost = site.url.split('/')[2];

        // Support test environment
        if (tabUrl.includes('localhost') && tabUrl.includes(`/${siteId}`)) {
          return true;
        }

        return tabUrl.includes(siteHost);
      });

    // Open all tabs and track the first new one
    let firstNewTabSite: string | null = null;

    for (const siteId of sitesToOpen) {
      const site = this.sites[siteId];
      if (!site) continue;

      const existingTabs = await browser.tabs.query({ url: site.url + '*' });
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

    if (enabledSites.length === 0) {
      throw new Error('No enabled sites to send message to');
    }

    // Prepare batch injection data
    const injections: Array<{
      tabId: number;
      message: string;
      siteConfig: SiteConfig;
    }> = [];

    // First, ensure all tabs are available and get their IDs
    for (const siteId of enabledSites) {
      const site = this.sites[siteId];
      if (!site) continue;

      try {
        // Query for tabs with the site URL pattern
        let tabs = await browser.tabs.query({ url: site.url + '*' });

        // Also check for test environment tabs (localhost)
        if (tabs.length === 0) {
          const testTabs = await browser.tabs.query({
            url: `*://localhost:*/${siteId}*`,
          });
          tabs = testTabs;
        }

        // If no tabs exist, open one
        if (tabs.length === 0) {
          await this.tabManager.openOrFocusTab(site, false);
          tabs = await browser.tabs.query({ url: site.url + '*' });

          // Try test URL again if production URL didn't work
          if (tabs.length === 0) {
            const testTabs = await browser.tabs.query({
              url: `*://localhost:*/${siteId}*`,
            });
            tabs = testTabs;
          }
        }

        if (tabs.length > 0 && tabs[0].id) {
          // Wait for tab to be ready
          await this.tabManager.waitForTabReady(tabs[0].id);

          injections.push({
            tabId: tabs[0].id,
            message: payload.message,
            siteConfig: site,
          });
        } else {
          logger.error(`Failed to get tab for site ${siteId}`);
        }
      } catch (error) {
        logger.error(`Failed to prepare injection for ${siteId}:`, error);
      }
    }

    if (injections.length === 0) {
      throw new Error('No tabs available for message injection');
    }

    // Convert injections to BatchInjectionConfig format
    const batchConfigs: BatchInjectionConfig[] = injections.map((inj) => ({
      tabId: inj.tabId,
      siteConfig: inj.siteConfig,
    }));

    // Execute batch injection using executeScript
    const results = await this.injector.batchInject(
      payload.message,
      batchConfigs,
      3,
    );

    // Analyze results
    const failed = results.filter((r) => !r.result.success);

    // Log failures for debugging
    failed.forEach((result) => {
      const site = batchConfigs.find(
        (inj) => inj.tabId === result.tabId,
      )?.siteConfig;
      logger.error(
        `Failed to inject message to ${site?.name || result.tabId}:`,
        result.result.error,
      );
    });

    // If all sites failed, throw an error with detailed info
    if (failed.length === results.length) {
      const errorDetails = failed
        .map((r) => {
          const site = batchConfigs.find(
            (inj) => inj.tabId === r.tabId,
          )?.siteConfig;
          return `${site?.name || r.tabId}: ${r.result.error}`;
        })
        .join('\n');
      throw new Error(`All message injections failed:\n${errorDetails}`);
    }

    // If some failed, log warnings but don't throw (robust behavior)
    if (failed.length > 0) {
      const errorDetails = failed
        .map((r) => {
          const site = batchConfigs.find(
            (inj) => inj.tabId === r.tabId,
          )?.siteConfig;
          return `${site?.name || r.tabId}: ${r.result.error}`;
        })
        .join('\n');

      const successCount = results.length - failed.length;
      logger.warn(
        `Partial injection failure (${successCount}/${results.length} succeeded):\n${errorDetails}`,
      );
    }

    // Log successful injections for debugging
    const successful = results.filter((r) => r.result.success);
    successful.forEach((result) => {
      const site = batchConfigs.find(
        (inj) => inj.tabId === result.tabId,
      )?.siteConfig;
      logger.debug(
        `Successfully injected message to ${site?.name || result.tabId}`,
        result.result.details,
      );
    });
  }

  // Legacy method removed - now using executeScript batch injection approach
  // All injection logic is handled in sendMessageToSites() method
}
