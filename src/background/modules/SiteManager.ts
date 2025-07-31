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
      };
    });
  }

  async toggleSite(payload: SiteTogglePayload): Promise<void> {
    const site = this.sites[payload.siteId];
    if (site) {
      site.enabled = payload.enabled;
      // Note: Storage is handled by the popup, no need to save here
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
}
