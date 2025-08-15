import { browser } from '#imports';
import type { SiteTogglePayload, UserPreferences, SiteConfig } from '../types';
import { logger } from '@/shared';
import { getAllSiteConfigs } from './siteConfigs';

export class SiteManager {
  private sites: Record<string, SiteConfig> = {};
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  constructor() {
    this.sites = getAllSiteConfigs();
    // Start initialization but don't block constructor
    this.initializationPromise = this.initialize();
  }

  /**
   * Initialize the site manager by loading user preferences
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    await this.loadUserPreferences();
    this.isInitialized = true;
    logger.info('SiteManager initialized successfully');
  }

  /**
   * Ensure initialization is complete before proceeding
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializationPromise;
    }
  }

  /**
   * Get all site configurations (read-only access)
   */
  async getAllSites(): Promise<Record<string, SiteConfig>> {
    await this.ensureInitialized();
    return { ...this.sites }; // Return a copy to prevent external modification
  }

  /**
   * Get site by ID
   */
  async getSite(siteId: string): Promise<SiteConfig | undefined> {
    await this.ensureInitialized();
    return this.sites[siteId];
  }

  /**
   * Get all site values as array
   */
  async getSiteValues(): Promise<SiteConfig[]> {
    await this.ensureInitialized();
    return Object.values(this.sites);
  }

  async getSiteByUrl(href: string): Promise<SiteConfig | null> {
    await this.ensureInitialized();
    for (const config of Object.values(this.sites)) {
      if (config.url.match(href)) {
        return config;
      }
    }
    return null;
  }

  async toggleSite(payload: SiteTogglePayload): Promise<void> {
    await this.ensureInitialized();
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
