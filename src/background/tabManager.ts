import { browser } from '#imports';
import type { SiteConfig } from '../types/siteConfig';
import { logger } from '@/shared';
import type { Browser } from 'wxt/browser';
import type { SiteManager } from './siteManager';

export class TabManager {
  constructor(private siteManager: SiteManager) {}

  /**
   * Check if a tab URL matches the chat URI patterns for a site
   */
  private isTabInChatContext(tabUrl: string, site: SiteConfig): boolean {
    // If no chat URI patterns are defined, fall back to basic URL matching
    if (!site.chatUriPatterns || site.chatUriPatterns.length === 0) {
      return tabUrl.startsWith(site.url);
    }

    try {
      const siteUrlObj = new URL(site.url);
      const tabUrlObj = new URL(tabUrl);

      // Must be same host first
      if (tabUrlObj.hostname !== siteUrlObj.hostname) {
        return false;
      }

      // Check if tab URL matches any of the chat URI patterns
      return site.chatUriPatterns.some((pattern) => {
        if (pattern === '/') {
          // Root path pattern matches the base path
          return (
            tabUrlObj.pathname === siteUrlObj.pathname ||
            tabUrlObj.pathname === siteUrlObj.pathname.replace(/\/$/, '')
          );
        }

        // Convert pattern to regex
        // /c/* becomes /^\/c\/.*$/
        // /app becomes /^\/app$/
        // /app/* becomes /^\/app\/.*$/ or /^\/app$/
        const regexPattern = pattern
          .replace(/\*/g, '.*') // Replace * with .*
          .replace(/\//g, '\\/'); // Escape forward slashes

        const regex = new RegExp(`^${regexPattern}$`);

        // For patterns ending with /*, also match the path without trailing content
        if (pattern.endsWith('/*')) {
          const basePattern = pattern.slice(0, -2); // Remove /*
          const baseRegex = new RegExp(
            `^${basePattern.replace(/\//g, '\\/')}$`,
          );
          return (
            regex.test(tabUrlObj.pathname) || baseRegex.test(tabUrlObj.pathname)
          );
        }

        return regex.test(tabUrlObj.pathname);
      });
    } catch (error) {
      logger.warn(
        `Failed to parse URLs for chat context check: ${tabUrl}, ${site.url}`,
        error,
      );
      return false;
    }
  }

  /**
   * Get current tab for a site by querying browser directly (no cached state)
   * Now filters for tabs that are in chat context based on chatUriPatterns
   */
  private async getTabForSite(
    site: SiteConfig,
  ): Promise<Browser.tabs.Tab | null> {
    try {
      const tabs = await browser.tabs.query({ url: site.url + '*' });

      // Filter tabs to only those in chat context
      const chatTabs = tabs.filter(
        (tab) => tab.url && this.isTabInChatContext(tab.url, site),
      );

      return chatTabs.length > 0 ? chatTabs[0] : null;
    } catch (error) {
      logger.error(`Failed to query tabs for ${site.name}:`, error);
      return null;
    }
  }

  /**
   * Get all AI site tabs currently open that are in chat context
   */
  private async getAllSiteTabs(): Promise<Browser.tabs.Tab[]> {
    try {
      const allTabs = await browser.tabs.query({});
      const siteValues = await this.siteManager.getSiteValues();

      return allTabs.filter((tab) => {
        if (!tab.url) return false;

        return siteValues.some(
          (site) => tab.url && this.isTabInChatContext(tab.url, site),
        );
      });
    } catch (error) {
      logger.error('Failed to query all AI site tabs:', error);
      return [];
    }
  }

  /**
   * Get status of a site by checking its tab existence and state
   * Now checks for tabs in chat context only
   */
  async getSiteStatus(
    site: SiteConfig,
  ): Promise<'connected' | 'loading' | 'disconnected' | 'error'> {
    try {
      const tabs = await browser.tabs.query({ url: site.url + '*' });

      // Filter to only chat context tabs
      const chatTabs = tabs.filter(
        (tab) => tab.url && this.isTabInChatContext(tab.url, site),
      );

      if (chatTabs.length === 0) {
        return 'disconnected';
      }

      const tab = chatTabs[0];
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

  /**
   * Check if current active tab is an AI site in chat context
   */
  async isCurrentTabAISite(enabledSiteIds: string[]): Promise<boolean> {
    try {
      const currentTab = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!currentTab[0]?.url) {
        return false;
      }

      const tabUrl = currentTab[0].url;

      const matchResults = await Promise.all(
        enabledSiteIds.map(async (siteId) => {
          const site = await this.siteManager.getSite(siteId);
          if (!site) return false;

          // Support test environment
          if (tabUrl.includes('localhost') && tabUrl.includes(`/${siteId}`)) {
            return true;
          }

          return this.isTabInChatContext(tabUrl, site);
        }),
      );

      return matchResults.some((result) => result);
    } catch (error) {
      logger.warn('Failed to check current tab:', error);
      return false;
    }
  }

  /**
   * Open tabs for all sites and focus first new tab if current tab is not AI site
   */
  async openAllTabsWithInstantFocus(siteIds: string[]): Promise<void> {
    const sites = await Promise.all(
      siteIds.map(async (siteId) => this.siteManager.getSite(siteId)),
    );
    const sitesToOpen = sites.filter(
      (site): site is SiteConfig => site?.enabled || false,
    );

    if (sitesToOpen.length === 0) return;

    // Check if current tab is an AI site
    const isCurrentTabAISite = await this.isCurrentTabAISite(
      sitesToOpen.map((s) => s.id),
    );

    // Open all tabs and track the first new one
    let firstNewTabSite: string | null = null;

    for (const site of sitesToOpen) {
      const existingTabs = await browser.tabs.query({ url: site.url + '*' });
      // Check if any existing tabs are in chat context
      const chatTabs = existingTabs.filter(
        (tab) => tab.url && this.isTabInChatContext(tab.url, site),
      );
      const isNewTab = chatTabs.length === 0;

      await this.openOrFocusTab(site, false);

      if (isNewTab && !firstNewTabSite) {
        firstNewTabSite = site.id;
      }
    }

    // If current tab is not an AI site and we opened new tabs, focus the first new one
    if (!isCurrentTabAISite && firstNewTabSite) {
      const firstNewSite = await this.siteManager.getSite(firstNewTabSite);
      if (firstNewSite) {
        await this.focusTab(firstNewTabSite);
      }
    }
  }

  /**
   * Launch all tabs for sites with true concurrency - no sequential delays
   * Returns array of { site, tabId } for existing and newly created tabs
   */
  async launchAllTabs(
    sites: SiteConfig[],
  ): Promise<Array<{ site: SiteConfig; tabId: number }>> {
    // Step 1: Query ALL existing tabs at once
    const existingTabsPromise = Promise.all(
      sites.map((site) => this.getTabForSite(site)),
    );

    // Step 2: Query ALL test environment tabs at once
    const testTabsPromise = Promise.all(
      sites.map((site) =>
        browser.tabs
          .query({ url: `*://localhost:*/${site.id}*` })
          .then((tabs) => (tabs.length > 0 ? tabs[0] : null))
          .catch(() => null),
      ),
    );

    // Wait for all queries to complete
    const [existingTabs, testTabs] = await Promise.all([
      existingTabsPromise,
      testTabsPromise,
    ]);

    // Step 3: Determine which sites need new tabs (no delays)
    const sitesNeedingNewTabs: SiteConfig[] = [];
    const resultTabs: Array<{ site: SiteConfig; tabId: number }> = [];

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const existingTab = existingTabs[i];
      const testTab = testTabs[i];

      if (existingTab?.id) {
        // Use existing production tab
        resultTabs.push({ site, tabId: existingTab.id });
      } else if (testTab?.id) {
        // Use existing test tab
        resultTabs.push({ site, tabId: testTab.id });
      } else {
        // Need to create new tab
        sitesNeedingNewTabs.push(site);
      }
    }

    // Step 4: Create ALL new tabs simultaneously (zero sequential delays)
    if (sitesNeedingNewTabs.length > 0) {
      const newTabsPromises = sitesNeedingNewTabs.map((site) =>
        browser.tabs
          .create({
            url: site.url,
            active: false, // Don't focus yet
          })
          .then((tab) => ({ site, tab }))
          .catch((error) => {
            logger.error(`Failed to create tab for ${site.name}:`, error);
            return null;
          }),
      );

      const newTabResults = await Promise.all(newTabsPromises);

      // Add successfully created tabs to results
      for (const result of newTabResults) {
        if (result?.tab?.id) {
          resultTabs.push({ site: result.site, tabId: result.tab.id });
        }
      }
    }

    logger.debug(
      `Launched ${resultTabs.length} tabs concurrently: ${
        resultTabs.length - sitesNeedingNewTabs.length
      } existing, ${sitesNeedingNewTabs.length} new`,
    );
    return resultTabs;
  }

  /**
   * Focus the first tab based on browser tab order if current tab is not an AI site
   */
  async focusFirstTabIfNeeded(tabIds: number[]): Promise<void> {
    if (tabIds.length === 0) return;

    try {
      // Get current active tab
      const currentTab = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentUrl = currentTab[0]?.url;

      if (!currentUrl) {
        // No current tab, focus the first one
        await browser.tabs.update(tabIds[0], { active: true });
        return;
      }

      // Check if current tab is an AI site in chat context
      const enabledSites = (await this.siteManager.getSiteValues()).filter(
        (site) => site.enabled,
      );
      const isCurrentTabAISite = enabledSites.some((site) =>
        this.isTabInChatContext(currentUrl, site),
      );

      if (!isCurrentTabAISite) {
        // Current tab is not an AI site, focus the first AI tab
        await browser.tabs.update(tabIds[0], { active: true });
      }
    } catch (error) {
      logger.warn('Failed to focus first tab:', error);
    }
  }

  async openOrFocusTab(site: SiteConfig, shouldFocus = false): Promise<void> {
    try {
      const existingTab = await this.getTabForSite(site);

      if (existingTab?.id) {
        // Tab exists, focus if needed
        if (shouldFocus) {
          await browser.tabs.update(existingTab.id, { active: true });
          if (existingTab.windowId) {
            await browser.windows.update(existingTab.windowId, {
              focused: true,
            });
          }
        }
      } else {
        // Create new tab
        await browser.tabs.create({
          url: site.url,
          active: shouldFocus,
        });

        // NOTE: No longer waiting for tab readiness here - that's handled elsewhere
      }
    } catch (error) {
      logger.error(`Failed to open/focus tab for ${site.name}:`, error);
    }
  }

  async focusTab(siteId: string): Promise<void> {
    const site = await this.siteManager.getSite(siteId);
    if (!site || !site.enabled) {
      logger.warn(`Cannot focus tab for disabled site: ${siteId}`);
      return;
    }

    const existingTab = await this.getTabForSite(site);

    if (existingTab?.id) {
      // Tab exists, focus it
      await browser.tabs.update(existingTab.id, { active: true });
      if (existingTab.windowId) {
        await browser.windows.update(existingTab.windowId, { focused: true });
      }
    } else {
      // No tab exists, create and focus
      await this.openOrFocusTab(site, true);
    }
  }

  async closeTab(siteId: string): Promise<void> {
    const site = await this.siteManager.getSite(siteId);
    if (!site) return;

    const existingTab = await this.getTabForSite(site);
    if (existingTab?.id) {
      try {
        await browser.tabs.remove(existingTab.id);
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
        await browser.tabs.remove(tabIds);
      }
    } catch (error) {
      logger.error('Failed to close all tabs:', error);
      throw error;
    }
  }

  /**
   * Wait for tab to be ready by actively checking tab status
   */
  async waitForTabReady(tabId: number): Promise<void> {
    const maxRetries = 60; // 60 retries = up to 60 seconds total
    const checkInterval = 1000; // Check every 1000ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const tab = await browser.tabs.get(tabId);

        // Check if tab is ready
        if (
          tab.status === 'complete' &&
          tab.url &&
          !tab.url.startsWith('chrome://')
        ) {
          logger.debug(
            `Tab ${tabId} is ready after ${attempt * checkInterval}ms`,
          );
          return;
        }

        // Tab not ready yet, wait before next check
        if (attempt < maxRetries) {
          logger.debug(
            `Tab ${tabId} not ready (status: ${tab.status}), waiting... (attempt ${attempt}/${maxRetries})`,
          );
          await this.sleep(checkInterval);
        }
      } catch (error) {
        // Tab might not exist yet, wait and retry
        if (attempt < maxRetries) {
          logger.debug(
            `Tab ${tabId} query failed, retrying... (attempt ${attempt}/${maxRetries}):`,
            error,
          );
          await this.sleep(checkInterval);
        } else {
          logger.warn(`Tab ${tabId} never became accessible:`, error);
          throw error;
        }
      }
    }

    // If we get here, tab never became ready
    logger.warn(
      `Tab ${tabId} never became ready after ${maxRetries * checkInterval}ms`,
    );
    throw new Error(`Tab ${tabId} did not become ready within timeout`);
  }

  /**
   * Helper function for delays
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Content script methods removed - using smart executeScript approach instead
}
