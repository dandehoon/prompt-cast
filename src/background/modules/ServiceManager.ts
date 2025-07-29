import {
  ServiceTogglePayload,
  AIService,
  UserPreferences,
} from '../../shared/types';
import { SERVICE_CONFIGS } from '../../shared/serviceConfig';
import { logger } from '../../shared/logger';

export class ServiceManager {
  public services: Record<string, AIService> = {};

  constructor() {
    this.initializeServices();
    this.loadUserPreferences();
  }

  private initializeServices(): void {
    // Dynamically create services from SERVICE_CONFIGS
    Object.values(SERVICE_CONFIGS).forEach((config) => {
      this.services[config.id] = {
        id: config.id,
        name: config.name,
        url: config.url,
        enabled: config.enabled, // Use config's enabled instead of hardcoded true
        status: 'disconnected',
      };
    });
  }

  async toggleService(payload: ServiceTogglePayload): Promise<void> {
    const service = this.services[payload.serviceId];
    if (service) {
      service.enabled = payload.enabled;
      await this.saveUserPreferences();

      // Only close tab when disabling service, don't open when enabling
      if (!payload.enabled && service.tabId) {
        // If disabling service and has an open tab, close it
        try {
          await chrome.tabs.remove(service.tabId);
          service.tabId = undefined;
          service.status = 'disconnected';
        } catch (error) {
          logger.error(`Failed to close tab for ${service.name}:`, error);
        }
      }
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['userPreferences']);
      if (result.userPreferences) {
        const prefs: UserPreferences = result.userPreferences;
        // Update service enabled states from saved preferences
        Object.keys(this.services).forEach((serviceId) => {
          const typedServiceId = serviceId;
          if (prefs.services && prefs.services[typedServiceId]) {
            this.services[typedServiceId].enabled =
              prefs.services[typedServiceId]!.enabled;
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
        services: {},
      };

      Object.keys(this.services).forEach((serviceId) => {
        const typedServiceId = serviceId;
        preferences.services[typedServiceId] = {
          enabled: this.services[typedServiceId].enabled,
        };
      });

      await chrome.storage.sync.set({ userPreferences: preferences });
    } catch (error) {
      logger.error('Failed to save user preferences:', error);
    }
  }
}
