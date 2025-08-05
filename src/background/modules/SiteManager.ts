import type {
  SiteTogglePayload,
  UserPreferences,
  SiteConfigsPayload,
  SiteConfig,
} from '../../types';
import { logger } from '../../shared/logger';

export class SiteManager {
  public sites: Record<string, SiteConfig> = {};
  private siteConfigs: Record<string, SiteConfig> = {};

  constructor() {
    // Sites will be initialized via message-based communication
    this.loadUserPreferences();
  }

  // Initialize sites from configuration received via message
  initializeSitesFromConfigs(payload: SiteConfigsPayload): void {
    this.sites = payload.configs;
    this.siteConfigs = payload.configs;
    logger.debug(
      'Sites initialized from configuration:',
      Object.keys(this.sites),
    );
  }

  getSiteByHostname(hostname: string): SiteConfig | null {
    for (const config of Object.values(this.siteConfigs)) {
      if (config.hostPatterns?.some((pattern) => hostname.includes(pattern))) {
        return config;
      }
    }
    return null;
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
