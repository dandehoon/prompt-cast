import { useState, useEffect, useCallback } from 'react';
import { SiteConfig } from '../../shared/types';
import { SITE_CONFIGS } from '../../shared/siteConfig';
import { ChromeMessaging } from '../../shared/messaging';
import { logger } from '../../shared/logger';

// Initialize sites from centralized SITE_CONFIGS
function createDefaultSites(): SiteConfig {
  const sites: SiteConfig = {};

  Object.values(SITE_CONFIGS).forEach((config) => {
    sites[config.id] = {
      id: config.id,
      name: config.name,
      url: config.url,
      enabled: config.enabled,
      status: 'disconnected',
    };
  });

  return sites;
}

export function useSites() {
  const [sites, setSites] = useState<SiteConfig>(createDefaultSites());

  const refreshSiteStates = useCallback(async () => {
    try {
      const tabs = await ChromeMessaging.queryTabs({});

      setSites((prevSites) => {
        const newSites = { ...prevSites };

        // Reset all sites to disconnected
        Object.values(newSites).forEach((site) => {
          site.status = 'disconnected';
          site.tabId = undefined;
        });

        // Check which sites have open tabs
        tabs.forEach((tab) => {
          Object.values(newSites).forEach((site) => {
            if (tab.url && tab.url.startsWith(site.url)) {
              site.status = 'connected';
              site.tabId = tab.id;
            }
          });
        });

        return newSites;
      });
    } catch (error) {
      logger.error('Failed to refresh site states:', error);
    }
  }, []);

  const toggleSite = useCallback((siteId: string, enabled: boolean) => {
    setSites((prev) => ({
      ...prev,
      [siteId]: {
        ...prev[siteId],
        enabled,
      },
    }));
  }, []);

  const getEnabledSites = useCallback(() => {
    return Object.keys(sites).filter((siteId) => sites[siteId].enabled);
  }, [sites]);

  const getConnectedCount = useCallback(() => {
    return Object.values(sites).filter((s) => s.status === 'connected').length;
  }, [sites]);

  const getEnabledCount = useCallback(() => {
    return Object.values(sites).filter((s) => s.enabled).length;
  }, [sites]);

  useEffect(() => {
    refreshSiteStates();
  }, [refreshSiteStates]);

  return {
    sites,
    toggleSite,
    refreshSiteStates,
    getEnabledSites,
    getConnectedCount,
    getEnabledCount,
  };
}
