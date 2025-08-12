import { browser } from '#imports';
import type {
  SiteTogglePayload,
  UserPreferences,
  SiteConfigsPayload,
  SiteConfig,
} from '../types';
import { logger } from '@/shared';
import { getAllSiteConfigs } from './siteConfigs';

export class SiteManager {
  public sites: Record<string, SiteConfig> = {};

  constructor() {
    this.sites = getAllSiteConfigs();
    this.loadUserPreferences();
  }

  initializeSitesFromConfigs(payload: SiteConfigsPayload): void {
    this.sites = payload.configs;
  }

  getSiteByUrl(href: string): SiteConfig | null {
    for (const config of Object.values(this.sites)) {
      if (config.url.match(href)) {
        return config;
      }
    }
    return null;
  }

  async toggleSite(payload: SiteTogglePayload): Promise<void> {
    const site = this.sites[payload.siteId];
    if (site) {
      site.enabled = payload.enabled;
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const result = await browser.storage.sync.get(['userPreferences']);
      if (result.userPreferences) {
        const prefs: UserPreferences = result.userPreferences;
        // Update site enabled states from saved preferences
        Object.keys(this.sites).forEach((siteId) => {
          const typedSiteId = siteId;
          if (prefs.sites && prefs.sites[typedSiteId]) {
            this.sites[typedSiteId].enabled = prefs.sites[typedSiteId]!.enabled;
          }
        });
      }
    } catch (error) {
      logger.error('Failed to load user preferences:', error);
    }
  }
}
