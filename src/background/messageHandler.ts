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
    this.injector = new ExecuteScriptInjector();
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
      // First, ensure all tabs are open and ready
      await this.tabManager.openAllTabsWithInstantFocus(payload.sites);

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

  private async sendMessageToSites(payload: SendMessagePayload): Promise<void> {
    const sites = await Promise.all(
      payload.sites.map(async (siteId) => this.siteManager.getSite(siteId)),
    );
    const enabledSites = sites.filter(
      (site): site is SiteConfig => site?.enabled || false,
    );

    if (enabledSites.length === 0) {
      throw new Error('No enabled sites to send message to');
    }

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

    // Check if any injections succeeded
    const successCount = results.filter((r) => r.result.success).length;
    const failureCount = results.length - successCount;

    if (successCount === 0) {
      throw new Error(`All ${results.length} injection attempts failed`);
    }

    logger.info(
      `Message injection completed: ${successCount} succeeded, ${failureCount} failed`,
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
