import type { SendMessagePayload, SiteConfig } from '@/types';
import type { SiteStatusType } from '@/shared';
import { logger } from '@/shared';
import { TabManager } from './tabManager';
import { ExecuteScriptInjector } from './scriptInjector';
import type { SiteManager } from './siteManager';

export class MessageHandler {
  private injector: ExecuteScriptInjector;

  constructor(
    private siteManager: SiteManager,
    private tabManager: TabManager,
  ) {
    this.injector = new ExecuteScriptInjector(this.tabManager);
  }

  /**
   * Get current status for a site by checking if its tab exists
   * With executeScript approach, we don't need to check content script readiness
   */
  async getSiteStatus(site: SiteConfig): Promise<SiteStatusType> {
    return this.tabManager.getSiteStatus(site);
  }

  async sendMessageToSitesRobust(payload: SendMessagePayload): Promise<void> {
    try {
      // Send messages to all sites with built-in tab launching and error handling
      await this.sendMessageToSites(payload);
    } catch (error) {
      logger.error('Message delivery failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async sendMessageToSites(payload: SendMessagePayload): Promise<void> {
    // Get ordered enabled sites from SiteManager instead of using payload.sites order
    const orderedEnabledSites = await this.siteManager.getOrderedEnabledSites();

    // Filter to only include sites that were actually requested
    const requestedSiteIds = new Set(payload.sites);
    const enabledSites = orderedEnabledSites.filter(
      (site) => requestedSiteIds.has(site.id) && site.enabled,
    );

    if (enabledSites.length === 0) {
      throw new Error('No enabled sites to send message to');
    }

    logger.debug(
      'Using ordered enabled sites:',
      enabledSites.map((s) => s.name),
    );

    // Step 1: Launch ALL tabs concurrently (no waiting for readiness)
    logger.debug('Launching tabs for all enabled sites concurrently...');
    const validTabs = await this.tabManager.launchAllTabs(enabledSites);

    if (validTabs.length === 0) {
      throw new Error('No tabs could be launched for message injection');
    }

    // Step 2: Focus first tab if current tab is not an AI site (no waiting)
    const tabIds = validTabs.map((t) => t.tabId);
    await this.tabManager.focusFirstTabIfNeeded(tabIds);

    // Step 3: Start independent processing for each tab (each waits for its own readiness)
    logger.debug('Starting independent processing for each tab...');
    const injectionPromises = validTabs.map(async ({ site, tabId }) => {
      return this.processTabIndependently(tabId, site, payload.message);
    });

    // Step 4: Wait for all independent processes to complete
    const results = await Promise.all(injectionPromises);

    // Map results back to sites to get site names for failures
    const siteResultMap = new Map();
    validTabs.forEach(({ site, tabId }) => {
      const result = results.find((r) => r.tabId === tabId);
      siteResultMap.set(site.id, { site, result: result?.result });
    });

    // Collect success and failure information
    const successfulSites: string[] = [];
    const failedSites: Array<{ name: string; error: string }> = [];

    for (const [, { site, result }] of siteResultMap.entries()) {
      if (result?.success) {
        successfulSites.push(site.name);
      } else {
        failedSites.push({
          name: site.name,
          error: result?.error || 'Unknown error',
        });
      }
    }

    // If some failed, throw with partial success info
    if (failedSites.length > 0) {
      const failedSiteNames = failedSites.map((f) => f.name).join(', ');
      throw new Error(`Failed to send message to ${failedSiteNames}`);
    }

    logger.info(
      `Message injection completed: ${
        successfulSites.length
      } succeeded (${successfulSites.join(', ')})`,
    );
  }

  /**
   * Process a single tab independently: wait for ready → inject message → return result
   */
  private async processTabIndependently(
    tabId: number,
    site: SiteConfig,
    message: string,
  ): Promise<{
    tabId: number;
    result: {
      success: boolean;
      error?: string;
      details?: Record<string, unknown>;
    };
  }> {
    try {
      // Step 1: Wait for this tab to be ready (independent of other tabs)
      await this.tabManager.waitForTabReady(tabId);

      // Step 2: Inject message into this tab (independent of other tabs)
      const injectionConfig = { tabId, siteConfig: site };
      const results = await this.injector.batchInject(message, [
        injectionConfig,
      ]);

      // Return the result for this tab
      return (
        results[0] || {
          tabId,
          result: {
            success: false,
            error: 'No injection result returned',
          },
        }
      );
    } catch (error) {
      return {
        tabId,
        result: {
          success: false,
          error: `Tab processing failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      };
    }
  }

  // Legacy method removed - now using executeScript batch injection approach
  // All injection logic is handled in sendMessageToSites() method
}
