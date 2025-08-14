import { browser } from '#imports';
import type { SiteConfig } from '../types/siteConfig';
import { CONFIG } from '@/shared';
import { logger } from '@/shared';
import type { Browser } from 'wxt/browser';
import type { SiteManager } from './siteManager';

export class TabManager {
  constructor(private siteManager: SiteManager) {}

  /**
   * Get current tab for a site by querying browser directly (no cached state)
   */
  private async getTabForSite(
    site: SiteConfig,
  ): Promise<Browser.tabs.Tab | null> {
    try {
      const tabs = await browser.tabs.query({ url: site.url + '*' });
      return tabs.length > 0 ? tabs[0] : null;
    } catch (error) {
      logger.error(`Failed to query tabs for ${site.name}:`, error);
      return null;
    }
  }

  /**
   * Get all AI site tabs currently open
   */
  private async getAllSiteTabs(): Promise<Browser.tabs.Tab[]> {
    try {
      const allTabs = await browser.tabs.query({});
      return allTabs.filter((tab) =>
        this.siteManager
          .getSiteValues()
          .some((site) => tab.url && tab.url.startsWith(site.url)),
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
          await browser.tabs.update(existingTab.id, { active: true });
          if (existingTab.windowId) {
            await browser.windows.update(existingTab.windowId, {
              focused: true,
            });
          }
        }
      } else {
        // Create new tab
        const newTab = await browser.tabs.create({
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
    const site = this.siteManager.getSite(siteId);
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
    const site = this.siteManager.getSite(siteId);
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

  async waitForTabReady(tabId: number): Promise<void> {
    const { maxReadyAttempts, readyCheckInterval } = CONFIG.background.tab;

    return new Promise((resolve) => {
      let attempts = 0;

      const checkReady = async () => {
        attempts++;
        try {
          const tab = await browser.tabs.get(tabId);
          if (!tab) {
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
        } catch {
          if (attempts < maxReadyAttempts) {
            setTimeout(checkReady, readyCheckInterval);
          } else {
            resolve(); // Proceed anyway
          }
        }
      };

      checkReady();
    });
  }

  // Content script methods removed - using executeScript approach instead
  // waitForTabReady() method above handles basic tab readiness for executeScript
}
