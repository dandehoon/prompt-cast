import { writable, derived, get } from 'svelte/store';
import type { SiteConfig, EnhancedSite } from '@/types';
import type { SiteStatusType } from '@/shared';
import { SITE_STATUS } from '@/shared';
import { sendMessage } from '@/shared';
import { logger } from '@/shared';

// Internal stores
const siteConfigs = writable<Record<string, SiteConfig>>({});
const siteStatuses = writable<Record<string, SiteStatusType>>({});
const siteStates = writable<Record<string, { enabled: boolean }>>({});
const isLoading = writable<boolean>(true);

// Fetch configurations from background script
const fetchSiteConfigs = async (): Promise<Record<string, SiteConfig>> => {
  try {
    const response = await sendMessage('GET_SITE_CONFIGS');
    return response.data.configs;
  } catch (error) {
    logger.error('Failed to fetch site configs from background:', error);
    return {};
  }
};

// Helper to get initial site states from configs only
const getInitialStates = (
  configs: Record<string, SiteConfig>,
): Record<string, { enabled: boolean }> => {
  const initialStates: Record<string, { enabled: boolean }> = {};

  // Initialize from configs (background will override with user preferences)
  Object.keys(configs).forEach((siteId) => {
    initialStates[siteId] = { enabled: configs[siteId].enabled };
  });

  return initialStates;
};

// Initialize site states from configs
const initializeSites = async () => {
  try {
    isLoading.set(true);

    // Fetch configs from background (includes user preferences already applied)
    const configs = await fetchSiteConfigs();
    siteConfigs.set(configs);

    // Initialize states from the configs (which already have user preferences applied)
    const states = getInitialStates(configs);
    siteStates.set(states);
    siteStatuses.set({});

    // Refresh site statuses (with automatic retry if needed)
    await siteActions.refreshSiteStates();
  } catch (error) {
    logger.error('Failed to initialize sites:', error);
  } finally {
    isLoading.set(false);
  }
};

// Derived stores for computed values
export const isLoadingSites = isLoading;

export const enabledSites = derived(
  [siteConfigs, siteStates],
  ([$siteConfigs, $siteStates]) => {
    return Object.keys($siteConfigs).filter((siteId) => {
      const siteState = $siteStates[siteId];
      return siteState?.enabled ?? $siteConfigs[siteId].enabled;
    });
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

export const sitesWithStatus = derived(
  [siteConfigs, siteStatuses, siteStates],
  ([$siteConfigs, $siteStatuses, $siteStates]) => {
    return (isDark = false): Record<string, EnhancedSite> => {
      const result: Record<string, EnhancedSite> = {};

      Object.keys($siteConfigs).forEach((siteId) => {
        const config = $siteConfigs[siteId];
        if (config) {
          const color = isDark ? config.colors.dark : config.colors.light;
          result[siteId] = {
            ...config,
            status: $siteStatuses[siteId] || SITE_STATUS.DISCONNECTED,
            enabled: $siteStates[siteId]?.enabled ?? config.enabled,
            color,
          };
        }
      });

      return result;
    };
  },
);

// Actions
export const siteActions = {
  updateSiteStatus: (siteId: string, status: SiteStatusType) => {
    siteStatuses.update((current) => ({
      ...current,
      [siteId]: status,
    }));
  },

  toggleSite: async (siteId: string, enabled: boolean) => {
    // Update local state immediately for UI responsiveness
    siteStates.update((current) => ({
      ...current,
      [siteId]: { enabled },
    }));

    try {
      // Send message to background (background will persist to browser.storage.sync)
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

  getSiteWithStatus: (siteId: string, isDark = false): EnhancedSite | null => {
    const configs = get(siteConfigs);
    const statuses = get(siteStatuses);
    const states = get(siteStates);

    const config = configs[siteId];
    if (!config) return null;

    const color = isDark ? config.colors.dark : config.colors.light;
    return {
      ...config,
      status: statuses[siteId] || SITE_STATUS.DISCONNECTED,
      enabled: states[siteId]?.enabled ?? config.enabled,
      color,
    };
  },

  getSiteColor: (siteId: string, isDark = false): string => {
    const configs = get(siteConfigs);
    const config = configs[siteId];
    if (!config) {
      return '#6b7280'; // Default gray color
    }
    return isDark ? config.colors.dark : config.colors.light;
  },

  refreshSiteStates: async (retryCount = 0) => {
    try {
      const configs = get(siteConfigs);
      const updates: Record<string, SiteStatusType> = {};

      // Check status for each site
      await Promise.all(
        Object.keys(configs).map(async (siteId) => {
          try {
            const response = await sendMessage('GET_SITE_STATUS', { siteId });
            updates[siteId] = response.status;
          } catch (error) {
            logger.error(`Failed to get status for ${siteId}:`, error);
            updates[siteId] = SITE_STATUS.DISCONNECTED;
          }
        }),
      );

      siteStatuses.update((current) => ({
        ...current,
        ...updates,
      }));

      logger.debug('Site states refreshed:', updates);

      // If this is early attempt and we got mostly disconnected states, retry with increasing delays
      const disconnectedCount = Object.values(updates).filter(
        (status) => status === SITE_STATUS.DISCONNECTED,
      ).length;
      const totalSites = Object.keys(configs).length;
      const disconnectedRatio =
        totalSites > 0 ? disconnectedCount / totalSites : 0;

      // Retry strategy for slow networks
      if (retryCount < 3 && disconnectedRatio >= 0.8 && totalSites > 0) {
        const delayMs = Math.min(2000 * Math.pow(2, retryCount), 8000); // 2s, 4s, 8s max
        logger.debug(
          `${disconnectedCount}/${totalSites} sites disconnected on attempt ${
            retryCount + 1
          }, retrying in ${delayMs}ms...`,
        );
        setTimeout(() => {
          siteActions.refreshSiteStates(retryCount + 1);
        }, delayMs);
      }
    } catch (error) {
      logger.error('Failed to refresh site states:', error);
    }
  },

  initializeSites,
};

// Initialize the store
initializeSites().catch((error) => {
  logger.error('Failed to initialize sites:', error);
});
