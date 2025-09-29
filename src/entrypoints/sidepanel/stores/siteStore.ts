import { writable, derived, get } from 'svelte/store';
import type { SiteConfig, EnhancedSite } from '@/types';
import type { SiteStatusType } from '@/shared';
import { SITE_STATUS } from '@/shared';
import { sendMessage } from '@/shared';
import { logger, sleep } from '@/shared';
import { tabStateStore } from './tabStateStore';

// Internal stores
const siteConfigs = writable<Record<string, SiteConfig>>({});
const siteStates = writable<Record<string, { enabled: boolean }>>({});
const siteOrder = writable<string[]>([]);
const isLoading = writable<boolean>(true);

// Derive site statuses from tab states for single source of truth
const siteStatuses = derived(
  [tabStateStore, siteConfigs],
  ([$tabStates, $siteConfigs]) => {
    const statuses: Record<string, SiteStatusType> = {};

    // First, set all configured sites to disconnected by default
    Object.keys($siteConfigs).forEach((siteId) => {
      statuses[siteId] = SITE_STATUS.DISCONNECTED;
    });

    // Then update based on actual tab states
    Object.keys($tabStates).forEach((siteId) => {
      const tabInfo = $tabStates[siteId];
      if (tabInfo) {
        if (tabInfo.isReady) {
          statuses[siteId] = SITE_STATUS.CONNECTED;
        } else {
          statuses[siteId] = SITE_STATUS.LOADING;
        }
      }
    });

    return statuses;
  },
);

// Retry delay for background service worker initialization
const FETCH_RETRY_DELAY_MS = 200;

// Fetch configurations from background script with retry on failure
const fetchSiteConfigs = async (): Promise<Record<string, SiteConfig>> => {
  try {
    const response = await sendMessage('GET_SITE_CONFIGS');
    return response.data.configs;
  } catch (error) {
    logger.error('Failed to fetch site configs, will retry:', error);
    await sleep(FETCH_RETRY_DELAY_MS);
    try {
      const response = await sendMessage('GET_SITE_CONFIGS');
      return response.data.configs;
    } catch (retryError) {
      logger.error('Retry failed for site configs:', retryError);
      return {};
    }
  }
};

// Fetch site order from background script with retry on failure
const fetchSiteOrder = async (): Promise<string[]> => {
  try {
    const response = await sendMessage('GET_SITE_ORDER');
    return response.order;
  } catch (error) {
    logger.error('Failed to fetch site order, will retry:', error);
    await sleep(FETCH_RETRY_DELAY_MS);
    try {
      const response = await sendMessage('GET_SITE_ORDER');
      return response.order;
    } catch (retryError) {
      logger.error('Retry failed for site order:', retryError);
      return [];
    }
  }
};

// Initialize site states from configs
const getInitialStates = (
  configs: Record<string, SiteConfig>,
): Record<string, { enabled: boolean }> => {
  const initialStates: Record<string, { enabled: boolean }> = {};
  Object.keys(configs).forEach((siteId) => {
    initialStates[siteId] = { enabled: configs[siteId].enabled };
  });
  return initialStates;
};

// Utility functions for site ordering and filtering
const getOrderedSiteIds = (
  siteConfigs: Record<string, SiteConfig>,
  siteOrder: string[],
): string[] => {
  if (!siteOrder || siteOrder.length === 0) {
    return Object.keys(siteConfigs);
  }

  const orderedIds = siteOrder.filter((id) => siteConfigs[id]);
  const allIds = Object.keys(siteConfigs);
  const missingIds = allIds.filter((id) => !orderedIds.includes(id));

  return [...orderedIds, ...missingIds];
};

const isEnabledSite = (
  siteId: string,
  siteConfigs: Record<string, SiteConfig>,
  siteStates: Record<string, { enabled: boolean }>,
): boolean => {
  const siteState = siteStates[siteId];
  return siteState?.enabled ?? siteConfigs[siteId]?.enabled ?? false;
};

const createEnhancedSite = (
  siteId: string,
  config: SiteConfig,
  status: SiteStatusType,
  enabled: boolean,
  isDark: boolean,
  tabInfo: {
    hasTab: boolean;
    isTabReady: boolean;
    isActiveTab: boolean;
    tabId?: number;
  } = {
    hasTab: false,
    isTabReady: false,
    isActiveTab: false,
  },
): EnhancedSite => ({
  ...config,
  status,
  enabled,
  color: isDark ? config.colors.dark : config.colors.light,
  hasTab: tabInfo.hasTab,
  isTabReady: tabInfo.isTabReady,
  isActiveTab: tabInfo.isActiveTab,
  tabId: tabInfo.tabId,
});

// Initialize site states from configs
const initializeSites = async () => {
  try {
    const [configs, order] = await Promise.all([
      fetchSiteConfigs(),
      fetchSiteOrder(),
    ]);

    siteConfigs.set(configs);
    siteOrder.set(order);

    const states = getInitialStates(configs);
    siteStates.set(states);
  } catch (error) {
    logger.error('Failed to initialize sites:', error);
  } finally {
    isLoading.set(false);
  }
};

// Derived stores for computed values
export const isLoadingSites = isLoading;

export const enabledSites = derived(
  [siteConfigs, siteStates, siteOrder],
  ([$siteConfigs, $siteStates, $siteOrder]) => {
    const orderedSiteIds = getOrderedSiteIds($siteConfigs, $siteOrder);
    return orderedSiteIds.filter((siteId) =>
      isEnabledSite(siteId, $siteConfigs, $siteStates),
    );
  },
);

export const enabledCount = derived(
  enabledSites,
  ($enabledSites) => $enabledSites.length,
);

export const connectedCount = derived(
  [enabledSites, siteStatuses],
  ([$enabledSites, $siteStatuses]) => {
    return $enabledSites.filter(
      (siteId) => $siteStatuses[siteId] === SITE_STATUS.CONNECTED,
    ).length;
  },
);

export const orderedSites = derived(
  [siteConfigs, siteStatuses, siteStates, siteOrder, tabStateStore],
  ([$siteConfigs, $siteStatuses, $siteStates, $siteOrder, $tabStates]) => {
    return (isDark = false): EnhancedSite[] => {
      const orderedSiteIds = getOrderedSiteIds($siteConfigs, $siteOrder);

      return orderedSiteIds
        .map((siteId) => {
          const config = $siteConfigs[siteId];
          if (!config) return null;

          const status = $siteStatuses[siteId] || SITE_STATUS.DISCONNECTED;
          const enabled = isEnabledSite(siteId, $siteConfigs, $siteStates);
          const tabInfo = $tabStates[siteId];

          return createEnhancedSite(siteId, config, status, enabled, isDark, {
            hasTab: tabInfo !== null,
            isTabReady: tabInfo?.isReady ?? false,
            isActiveTab: tabInfo?.isActive ?? false,
            tabId: tabInfo?.tabId,
          });
        })
        .filter((site): site is EnhancedSite => site !== null);
    };
  },
);

// Utility functions for tab navigation
export const getNextTab = (
  currentSiteId?: string,
  isDark: boolean = false,
): EnhancedSite | null => {
  const orderedSitesFunction = get(orderedSites) as (
    isDark?: boolean,
  ) => EnhancedSite[];
  const allSites = orderedSitesFunction(isDark);
  const enabledTabSites = allSites.filter(
    (site: EnhancedSite) => site.enabled && site.hasTab,
  );

  if (enabledTabSites.length === 0) return null;

  if (!currentSiteId) {
    return enabledTabSites[0];
  }

  const currentIndex = enabledTabSites.findIndex(
    (site: EnhancedSite) => site.id === currentSiteId,
  );
  if (currentIndex === -1) {
    return enabledTabSites[0];
  }

  const nextIndex = (currentIndex + 1) % enabledTabSites.length;
  return enabledTabSites[nextIndex];
};

export const getPreviousTab = (
  currentSiteId?: string,
  isDark: boolean = false,
): EnhancedSite | null => {
  const orderedSitesFunction = get(orderedSites) as (
    isDark?: boolean,
  ) => EnhancedSite[];
  const allSites = orderedSitesFunction(isDark);
  const enabledTabSites = allSites.filter(
    (site: EnhancedSite) => site.enabled && site.hasTab,
  );

  if (enabledTabSites.length === 0) return null;

  if (!currentSiteId) {
    return enabledTabSites[enabledTabSites.length - 1];
  }

  const currentIndex = enabledTabSites.findIndex(
    (site: EnhancedSite) => site.id === currentSiteId,
  );
  if (currentIndex === -1) {
    return enabledTabSites[enabledTabSites.length - 1];
  }

  const previousIndex =
    currentIndex === 0 ? enabledTabSites.length - 1 : currentIndex - 1;
  return enabledTabSites[previousIndex];
};

// Actions
export const siteActions = {
  reorderSites: async (newOrder: string[]) => {
    siteOrder.set(newOrder);

    try {
      await sendMessage('SAVE_SITE_ORDER', { order: newOrder });
    } catch (error) {
      logger.error('Failed to save site order:', error);
    }
  },

  toggleSite: async (siteId: string, enabled: boolean) => {
    siteStates.update((current) => ({
      ...current,
      [siteId]: { enabled },
    }));

    try {
      await sendMessage('SITE_TOGGLE', { siteId, enabled });
    } catch (error) {
      logger.error('Failed to toggle site:', error);
      // Revert local state on error
      const configs = get(siteConfigs);
      siteStates.update((current) => ({
        ...current,
        [siteId]: { enabled: configs[siteId]?.enabled ?? false },
      }));
    }
  },

  initializeSites,
};

// Initialize the store
initializeSites().catch((error) => {
  logger.error('Failed to initialize sites:', error);
});
