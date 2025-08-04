import { useCallback, useEffect } from 'react';
import { useSiteUIStore } from '../stores/siteUIStore';
import { useTheme } from './useTheme';
import { ChromeMessaging } from '../../shared/messaging';
import { logger } from '../../shared/logger';
import { SITE_STATUS } from '../../shared/constants';

export function useSites() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const {
    getAllSitesWithStatus,
    getEnabledSites,
    getEnabledCount,
    getConnectedCount,
    updateSiteStatus,
    toggleSite: storeToggleSite,
    refreshSiteStates,
    syncConfigsToBackground,
  } = useSiteUIStore();

  // Get all sites with current theme colors
  const sites = getAllSitesWithStatus(isDark);

  const refreshSiteStatesFromTabs = useCallback(async () => {
    try {
      const tabs = await ChromeMessaging.queryTabs({});

      // Reset all sites to disconnected first
      Object.keys(sites).forEach((siteId) => {
        updateSiteStatus(siteId, SITE_STATUS.DISCONNECTED);
      });

      // Check which sites have active tabs
      if (tabs && tabs.length > 0) {
        Object.values(sites).forEach((site) => {
          const hasTab = tabs.some(
            (tab) => tab.url && tab.url.startsWith(site.url),
          );
          if (hasTab) {
            updateSiteStatus(site.id, SITE_STATUS.CONNECTED);
          }
        });
      }
    } catch (error) {
      logger.error('Failed to refresh site states:', error);
      // Fallback: call the store's refresh method
      await refreshSiteStates();
    }
  }, [sites, updateSiteStatus, refreshSiteStates]);

  const toggleSite = useCallback(
    async (siteId: string, enabled: boolean) => {
      storeToggleSite(siteId, enabled);
      // Sync the updated configuration to background
      await syncConfigsToBackground();
    },
    [storeToggleSite, syncConfigsToBackground],
  );

  // Initialize and refresh on mount
  useEffect(() => {
    refreshSiteStatesFromTabs();
  }, [refreshSiteStatesFromTabs]);

  return {
    sites,
    refreshSiteStates: refreshSiteStatesFromTabs,
    toggleSite,
    getEnabledSites,
    getConnectedCount,
    getEnabledCount,
  };
}
