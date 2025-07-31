import { SiteTogglePayload, AISite, UserPreferences } from '../../shared/types';
import { SITE_CONFIGS } from '../../shared/siteConfig';
import { logger } from '../../shared/logger';

export class SiteManager {
  public sites: Record<string, AISite> = {};

  constructor() {
    this.initializeSites();
    this.loadUserPreferences();
  }

  private initializeSites(): void {
    // Dynamically create sites from SITE_CONFIGS
    Object.values(SITE_CONFIGS).forEach((config) => {
      this.sites[config.id] = {
        id: config.id,
        name: config.name,
        url: config.url,
        enabled: config.enabled, // Use config's enabled instead of hardcoded true
        status: 'disconnected',
      };
    });
  }

  async toggleSite(payload: SiteTogglePayload): Promise<void> {
    const site = this.sites[payload.siteId];
    if (site) {
      site.enabled = payload.enabled;
      await this.saveUserPreferences();

      // Only close tab when disabling site, don't open when enabling
      if (!payload.enabled && site.tabId) {
        // If disabling site and has an open tab, close it
        try {
          await chrome.tabs.remove(site.tabId);
          site.tabId = undefined;
          site.status = 'disconnected';
        } catch (error) {
          logger.error(`Failed to close tab for ${site.name}:`, error);
        }
      }
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['userPreferences']);
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

  private async saveUserPreferences(): Promise<void> {
    try {
      const preferences: UserPreferences = {
        sites: {},
      };

      Object.keys(this.sites).forEach((siteId) => {
        const typedSiteId = siteId;
        preferences.sites[typedSiteId] = {
          enabled: this.sites[typedSiteId].enabled,
        };
      });

      await chrome.storage.sync.set({ userPreferences: preferences });
    } catch (error) {
      logger.error('Failed to save user preferences:', error);
    }
  }
}
