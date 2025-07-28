import {
  ServiceTogglePayload,
  AIService,
  UserPreferences,
  AIServiceId,
} from '../../shared/types';
import { SERVICE_CONFIGS } from '../../shared/serviceConfig';
import { logger } from '../../shared/logger';
import { TabManager } from './TabManager';

export class ServiceManager {
  private tabManager?: TabManager;
  public services: Record<string, AIService> = {
    chatgpt: {
      id: 'chatgpt',
      name: SERVICE_CONFIGS.chatgpt.name,
      url: SERVICE_CONFIGS.chatgpt.url,
      enabled: true,
      status: 'disconnected',
    },
    claude: {
      id: 'claude',
      name: SERVICE_CONFIGS.claude.name,
      url: SERVICE_CONFIGS.claude.url,
      enabled: true,
      status: 'disconnected',
    },
    gemini: {
      id: 'gemini',
      name: SERVICE_CONFIGS.gemini.name,
      url: SERVICE_CONFIGS.gemini.url,
      enabled: true,
      status: 'disconnected',
    },
    grok: {
      id: 'grok',
      name: SERVICE_CONFIGS.grok.name,
      url: SERVICE_CONFIGS.grok.url,
      enabled: true,
      status: 'disconnected',
    },
  };

  constructor(tabManager?: TabManager) {
    if (tabManager) {
      this.tabManager = tabManager;
    }
    this.loadUserPreferences();
  }

  setTabManager(tabManager: TabManager): void {
    this.tabManager = tabManager;
  }

  async toggleService(payload: ServiceTogglePayload): Promise<void> {
    const service = this.services[payload.serviceId];
    if (service) {
      service.enabled = payload.enabled;
      await this.saveUserPreferences();

      if (payload.enabled) {
        // If enabling service, launch and focus the tab
        try {
          if (this.tabManager) {
            await this.tabManager.focusTab(payload.serviceId);
          }
        } catch (error) {
          logger.error(
            `Failed to launch and focus tab for ${service.name}:`,
            error,
          );
        }
      } else if (service.tabId) {
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
          const typedServiceId = serviceId as AIServiceId;
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
        const typedServiceId = serviceId as AIServiceId;
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
