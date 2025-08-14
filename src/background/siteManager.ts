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
  private sites: Record<string, SiteConfig> = {};

  constructor() {
    this.sites = getAllSiteConfigs();
    this.loadUserPreferences();
  }

  /**
   * Get all site configurations (read-only access)
   */
  getAllSites(): Record<string, SiteConfig> {
    return { ...this.sites }; // Return a copy to prevent external modification
  }

  /**
   * Get site by ID
   */
  getSite(siteId: string): SiteConfig | undefined {
    return this.sites[siteId];
  }

  /**
   * Get all site values as array
   */
  getSiteValues(): SiteConfig[] {
    return Object.values(this.sites);
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
      // Save the change to browser storage
      await this.saveUserPreferences();
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      const preferences: UserPreferences = {
        sites: {},
      };

      // Build sites preferences from current state
      Object.keys(this.sites).forEach((siteId) => {
        preferences.sites[siteId] = {
          enabled: this.sites[siteId].enabled,
        };
      });

      await browser.storage.sync.set({ userPreferences: preferences });
      logger.info('User preferences saved successfully', preferences);
    } catch (error) {
      logger.error('Failed to save user preferences:', error);
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
            this.sites[typedSiteId].enabled =
              !!prefs.sites[typedSiteId].enabled;
          }
        });
      }
      logger.info('User preferences loaded successfully', result);
    } catch (error) {
      logger.error('Failed to load user preferences:', error);
    }
  }
}
