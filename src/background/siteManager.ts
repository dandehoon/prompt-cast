import { browser } from '#imports';
import type { SiteTogglePayload, UserPreferences, SiteConfig } from '../types';
import { logger } from '@/shared';
import { getAllSiteConfigs } from './siteConfigs';

export class SiteManager {
  private sites: Record<string, SiteConfig> = {};
  private siteOrder: string[] = [];
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

  /**
   * Get enabled sites in the specified order
   */
  async getOrderedEnabledSites(): Promise<SiteConfig[]> {
    await this.ensureInitialized();

    const allEnabledSites = Object.values(this.sites).filter(
      (site) => site.enabled,
    );

    if (this.siteOrder.length === 0) {
      return allEnabledSites;
    }

    // Create a map for quick lookup
    const enabledSiteMap = new Map(
      allEnabledSites.map((site) => [site.id, site]),
    );

    // Get ordered enabled sites and add any missing ones
    const orderedSites = this.siteOrder
      .map((id) => enabledSiteMap.get(id))
      .filter((site): site is SiteConfig => site !== undefined);

    // Add any enabled sites not in the order
    const orderedIds = new Set(orderedSites.map((site) => site.id));
    const missingSites = allEnabledSites.filter(
      (site) => !orderedIds.has(site.id),
    );

    return [...orderedSites, ...missingSites];
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

  /**
   * Get the current site order
   */
  async getSiteOrder(): Promise<string[]> {
    await this.ensureInitialized();
    return [...this.siteOrder]; // Return a copy
  }

  /**
   * Set a new site order
   */
  async setSiteOrder(order: string[]): Promise<void> {
    await this.ensureInitialized();

    // Validate that all provided site IDs exist
    const validOrder = order.filter((id) => this.sites[id]);

    // Add any missing sites to the end
    const allSiteIds = Object.keys(this.sites);
    const missingIds = allSiteIds.filter((id) => !validOrder.includes(id));

    this.siteOrder = [...validOrder, ...missingIds];
    await this.saveUserPreferences();
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      const preferences: UserPreferences = {
        sites: {},
        siteOrder: this.siteOrder,
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

        // Load site order, default to natural order if not saved
        if (prefs.siteOrder && Array.isArray(prefs.siteOrder)) {
          // Filter to only include valid site IDs and add any missing ones
          const validOrder = prefs.siteOrder.filter((id) => this.sites[id]);
          const allSiteIds = Object.keys(this.sites);
          const missingIds = allSiteIds.filter(
            (id) => !validOrder.includes(id),
          );
          this.siteOrder = [...validOrder, ...missingIds];
        } else {
          this.siteOrder = Object.keys(this.sites);
        }
      } else {
        // No preferences saved, use natural order
        this.siteOrder = Object.keys(this.sites);
      }
      logger.info('User preferences loaded successfully', result);
    } catch (error) {
      logger.error('Failed to load user preferences:', error);
      // Fallback to natural order on error
      this.siteOrder = Object.keys(this.sites);
    }
  }
}
