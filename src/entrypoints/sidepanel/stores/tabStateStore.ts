import { writable, derived, get } from 'svelte/store';
import { sendMessage, onMessage } from '@/shared';
import { logger } from '@/shared';
import type { TabInfo } from '@/types';

// Store to track tab state for all sites
const tabStates = writable<Record<string, TabInfo | null>>({});
const activeSiteId = writable<string | null>(null);
const lastUpdateTimestamp = writable<number>(0);

/**
 * Utility to check if two tab states are actually different
 */
function areTabStatesEqual(
  oldStates: Record<string, TabInfo | null>,
  newStates: Record<string, TabInfo | null>,
): boolean {
  const oldKeys = Object.keys(oldStates);
  const newKeys = Object.keys(newStates);

  if (oldKeys.length !== newKeys.length) return false;

  for (const key of oldKeys) {
    const oldTab = oldStates[key];
    const newTab = newStates[key];

    // Both null/undefined
    if (!oldTab && !newTab) continue;

    // One is null, other isn't
    if (!oldTab || !newTab) return false;

    // Compare all relevant properties
    if (
      oldTab.tabId !== newTab.tabId ||
      oldTab.url !== newTab.url ||
      oldTab.isActive !== newTab.isActive ||
      oldTab.isReady !== newTab.isReady ||
      oldTab.title !== newTab.title
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Smart update function that only updates if data actually changed
 */
function updateTabStatesIfChanged(
  newStates: Record<string, TabInfo | null>,
): boolean {
  const currentStates = get(tabStates);

  if (!areTabStatesEqual(currentStates, newStates)) {
    tabStates.set(newStates);
    lastUpdateTimestamp.set(Date.now());
    return true;
  }

  return false;
}

/**
 * Actions for managing tab state
 */
export const tabStateActions = {
  /**
   * Fetch the current tab state snapshot from background
   */
  async fetchSiteTabsState(): Promise<void> {
    try {
      const snapshot = await sendMessage('GET_SITE_TABS');

      const statesChanged = updateTabStatesIfChanged(snapshot.siteTabs);

      const currentActiveSiteId = get(activeSiteId);
      if (snapshot.activeSiteId !== currentActiveSiteId) {
        activeSiteId.set(snapshot.activeSiteId);
      }

      if (statesChanged) {
        logger.debug('Tab states updated from background');
      }
    } catch (error) {
      logger.warn('Failed to fetch tab state snapshot:', error);
    }
  },

  /**
   * Initialize the store and set up event listeners
   */
  async initialize(): Promise<void> {
    // Fetch initial state
    await this.fetchSiteTabsState();

    // Listen for tab events from background script for instant updates
    onMessage('TAB_EVENT', (message) => {
      const { eventType, affectedSiteId, currentActiveSiteId, tabInfo } = message.data;

      // Update active site immediately
      if (currentActiveSiteId !== get(activeSiteId)) {
        activeSiteId.set(currentActiveSiteId);
      }

      // Use actual tab info for instant updates when available
      if (affectedSiteId && tabInfo) {
        const currentStates = get(tabStates);
        const newStates = {
          ...currentStates,
          [affectedSiteId]: tabInfo,
        };
        updateTabStatesIfChanged(newStates);
      }
      // Create placeholder state and refresh for accuracy
      else if (affectedSiteId && eventType !== 'removed') {
        const currentStates = get(tabStates);
        const newStates = {
          ...currentStates,
          [affectedSiteId]: {
            tabId: 0,
            siteId: affectedSiteId,
            url: '',
            isActive: affectedSiteId === currentActiveSiteId,
            isReady: eventType === 'updated',
          },
        };
        updateTabStatesIfChanged(newStates);

        setTimeout(() => this.fetchSiteTabsState(), 100);
      }
      // Handle site removal
      else if (affectedSiteId && eventType === 'removed') {
        const currentStates = get(tabStates);
        const newStates = { ...currentStates };
        delete newStates[affectedSiteId];
        updateTabStatesIfChanged(newStates);
      }
      // For general events, refresh all
      else {
        this.fetchSiteTabsState();
      }
    });

    // Listen for visibility changes to refresh when window regains focus
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          setTimeout(() => this.fetchSiteTabsState(), 100);
        }
      });

      window.addEventListener('focus', () => {
        setTimeout(() => this.fetchSiteTabsState(), 100);
      });
    }
  },

  /**
   * Get tab info for a specific site
   */
  getTabInfoForSite(siteId: string): TabInfo | null {
    const states = get(tabStates);
    return states[siteId] || null;
  },

  /**
   * Check if a site has an active tab
   */
  siteHasTab(siteId: string): boolean {
    const tabInfo = this.getTabInfoForSite(siteId);
    return tabInfo !== null;
  },

  /**
   * Check if a site's tab is ready (fully loaded)
   */
  siteTabIsReady(siteId: string): boolean {
    const tabInfo = this.getTabInfoForSite(siteId);
    return tabInfo?.isReady ?? false;
  },

  /**
   * Check if a site is the currently active tab
   */
  siteIsActiveTab(siteId: string): boolean {
    const tabInfo = this.getTabInfoForSite(siteId);
    return tabInfo?.isActive ?? false;
  },

  /**
   * Force refresh (for testing or manual refresh)
   */
  async forceRefresh(): Promise<void> {
    await this.fetchSiteTabsState();
  },
};

/**
 * Readable stores for reactive UI updates
 */
export const tabStateStore = {
  subscribe: tabStates.subscribe,
};

export const activeTabStore = {
  subscribe: activeSiteId.subscribe,
};

/**
 * Derived stores for specific tab information per site
 */
export const createSiteTabStore = (siteId: string) => {
  return derived(tabStates, ($tabStates) => $tabStates[siteId] || null);
};

export const createSiteTabStatusStore = (siteId: string) => {
  return derived(tabStates, ($tabStates) => {
    const tabInfo = $tabStates[siteId];
    return {
      hasTab: tabInfo !== null,
      isReady: tabInfo?.isReady ?? false,
      isActive: tabInfo?.isActive ?? false,
    };
  });
};

/**
 * Initialize the store when the module is loaded
 */
tabStateActions.initialize().catch((error: unknown) => {
  logger.warn('Failed to initialize tab state store:', error);
});
