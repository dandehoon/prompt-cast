import { derived } from 'svelte/store';
import { tabStateStore } from './tabStateStore';

/**
 * Derived store that tracks which site corresponds to the currently active tab
 * This is derived from tabStateStore to avoid duplicate event listeners
 */
export const activeSiteId = derived(tabStateStore, ($tabStates) => {
  // Find which site is currently active based on tab states
  const activeTabSiteId = Object.keys($tabStates).find((siteId) => {
    const tabInfo = $tabStates[siteId];
    return tabInfo?.isActive === true;
  });

  return activeTabSiteId || null;
});

/**
 * Readable store for the currently active site ID
 * This is automatically derived from tabStateStore, no initialization needed
 */
export const activeTabStore = {
  subscribe: activeSiteId.subscribe,
};
