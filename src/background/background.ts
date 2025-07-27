import {
  AIService,
  ServiceConfig,
  ExtensionMessage,
  SendMessagePayload,
  ServiceTogglePayload,
  UserPreferences,
} from '../shared/types';
import { EXTENSION_MESSAGE_TYPES, CONTENT_MESSAGE_TYPES } from '../shared/constants';
import { SERVICE_CONFIGS } from '../shared/serviceConfig';

class BackgroundService {
  private services: ServiceConfig = {
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

  constructor() {
    this.initializeListeners();
    this.loadUserPreferences();
  }

  private initializeListeners(): void {
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: any) => void,
      ) => {
        this.handleMessage(message, sender, sendResponse);
        return true; // Keep message channel open for async response
      },
    );

    // Tab listeners for cleanup and status updates
    chrome.tabs.onRemoved.addListener((tabId: number) => {
      this.handleTabClosed(tabId);
    });

    chrome.tabs.onUpdated.addListener(
      (
        tabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
        tab: chrome.tabs.Tab,
      ) => {
        if (changeInfo.status === 'complete' && tab.url) {
          this.handleTabUpdated(tabId, tab.url);
        }
      },
    );
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case EXTENSION_MESSAGE_TYPES.OPEN_TABS:
          await this.openAllTabs();
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.SEND_MESSAGE:
          await this.sendMessageToServicesRobust(
            message.payload as SendMessagePayload,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.SERVICE_TOGGLE:
          await this.toggleService(message.payload as ServiceTogglePayload);
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.CLOSE_TAB:
          await this.closeTab((message.payload as { serviceId: string }).serviceId);
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS:
          await this.closeAllTabs();
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.FOCUS_TAB:
          await this.focusTab((message.payload as { serviceId: string }).serviceId);
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.TAB_STATUS_UPDATE:
          // Handle status updates from content scripts
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['userPreferences']);
      if (result.userPreferences) {
        const prefs: UserPreferences = result.userPreferences;
        // Update service enabled states from saved preferences
        Object.keys(this.services).forEach(serviceId => {
          const typedServiceId = serviceId as keyof ServiceConfig;
          if (prefs.services && prefs.services[typedServiceId]) {
            this.services[typedServiceId].enabled =
              prefs.services[typedServiceId]!.enabled;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      const preferences: UserPreferences = {
        services: {},
      };

      Object.keys(this.services).forEach(serviceId => {
        const typedServiceId = serviceId as keyof ServiceConfig;
        preferences.services[typedServiceId] = {
          enabled: this.services[typedServiceId].enabled,
        };
      });

      await chrome.storage.sync.set({ userPreferences: preferences });
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  private async openAllTabs(): Promise<void> {
    const enabledServices = Object.entries(this.services).filter(
      ([_, service]) => service.enabled,
    );

    // Open all tabs concurrently
    const openPromises = enabledServices.map(([_serviceId, service]) =>
      this.openOrFocusTab(service).catch(error => {
        console.error(`Failed to open tab for ${service.name}:`, error);
        return null;
      }),
    );

    await Promise.all(openPromises);
  }

  private async openOrFocusTab(service: AIService): Promise<void> {
    try {
      // Check if tab already exists
      const existingTabs = await chrome.tabs.query({ url: service.url + '*' });

      if (existingTabs.length > 0) {
        // Focus existing tab
        const tab = existingTabs[0];
        await chrome.tabs.update(tab.id!, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });

        // Update service with existing tab ID
        service.tabId = tab.id;
        service.status = 'connected';
      } else {
        // Create new tab
        const tab = await chrome.tabs.create({
          url: service.url,
          active: false,
        });

        service.tabId = tab.id;
        service.status = 'loading';

        // Wait for the tab to fully load with extended timeout for new tabs
        await this.waitForTabReady(tab.id!);
        service.status = 'connected';
      }
    } catch (error) {
      console.error(`Failed to open/focus tab for ${service.name}:`, error);
      service.status = 'error';
    }
  }

  private async sendMessageToServicesRobust(
    payload: SendMessagePayload,
  ): Promise<void> {
    // First, ensure all tabs are open and ready
    await this.openAllTabs();

    // ChatGPT-specific delay for first-time initialization
    const hasChatGPT = payload.services.includes('chatgpt');
    const delay = hasChatGPT ? 5000 : 3000; // 5s for ChatGPT, 3s for others

    await new Promise(resolve => setTimeout(resolve, delay));

    // Now send messages to all services
    await this.sendMessageToServices(payload);
  }

  private async sendMessageToServices(
    payload: SendMessagePayload,
  ): Promise<void> {
    const enabledServices = payload.services.filter(
      serviceId => this.services[serviceId as keyof ServiceConfig]?.enabled,
    );

    // Process all services concurrently
    const sendPromises = enabledServices.map(serviceId =>
      this.sendToSingleService(serviceId, payload.message),
    );

    // Wait for all to complete
    const results = await Promise.allSettled(sendPromises);

    // Log results (only errors)
    results.forEach((result, index) => {
      const serviceId = enabledServices[index];
      if (result.status === 'rejected') {
        console.error(`Failed to send message to ${serviceId}:`, result.reason);
      }
    });
  }

  private async sendToSingleService(
    serviceId: string,
    message: string,
  ): Promise<void> {
    const service = this.services[serviceId as keyof ServiceConfig];

    try {
      // First, try to find current tabs for this service
      let tabs = await chrome.tabs.query({ url: service.url + '*' });

      // If no tabs exist, open one first
      if (tabs.length === 0) {
        await this.openOrFocusTab(service);
        // Query again after opening
        tabs = await chrome.tabs.query({ url: service.url + '*' });
      }

      if (tabs.length > 0) {
        const tab = tabs[0];
        service.tabId = tab.id;

        // Wait for tab to be fully loaded and content script ready
        await this.waitForContentScriptReady(tab.id!);

        // Try to send message with retry logic
        await this.sendMessageWithRetry(
          tab.id!,
          {
            type: CONTENT_MESSAGE_TYPES.INJECT_MESSAGE,
            payload: { message },
          },
          5, // Max retries
        );

        service.status = 'connected';
      } else {
        service.status = 'disconnected';
        service.tabId = undefined;
        throw new Error(`Failed to open or find ${service.name} tab`);
      }
    } catch (error) {
      console.error(`Failed to send message to ${service.name}:`, error);
      service.status = 'error';
      service.tabId = undefined;
      throw error;
    }
  }

  private async waitForContentScriptReady(tabId: number): Promise<void> {
    // First wait for tab to be ready
    await this.waitForTabReady(tabId);

    // Then check if content script is responding with longer timeout
    const maxAttempts = 30; // 30 attempts = 30 seconds max
    const delayBetweenAttempts = 1000; // 1 second

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: CONTENT_MESSAGE_TYPES.STATUS_CHECK,
        });

        if (response && response.ready) {
          return;
        }

        // If not ready, wait before next attempt
        if (attempt < maxAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, delayBetweenAttempts),
          );
        }
      } catch (_error) {
        // Content script might not be loaded yet, wait and retry
        if (attempt < maxAttempts) {
          await new Promise(resolve =>
            setTimeout(resolve, delayBetweenAttempts),
          );
        } else {
          // Proceed anyway after max attempts
        }
      }
    }
  }

  private async waitForTabReady(tabId: number): Promise<void> {
    return new Promise(resolve => {
      const checkReady = async (attempts = 0) => {
        try {
          const tab = await chrome.tabs.get(tabId);

          // Check if tab is fully loaded
          if (
            tab.status === 'complete' &&
            tab.url &&
            !tab.url.startsWith('chrome://')
          ) {
            resolve();
          } else if (attempts < 20) {
            // Max 10 seconds
            setTimeout(() => checkReady(attempts + 1), 500);
          } else {
            resolve(); // Give up after max attempts
          }
        } catch (_error) {
          resolve(); // Tab might be closed, just resolve
        }
      };

      checkReady();
    });
  }

  private async sendMessageWithRetry(
    tabId: number,
    message: any,
    maxRetries: number = 5,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await chrome.tabs.sendMessage(tabId, message);
        return; // Success
      } catch (error) {
        if (attempt < maxRetries) {
          // Wait before retry, with exponential backoff
          const delay = Math.min(attempt * 1500, 5000); // Max 5 second delay
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Final attempt failed
        }
      }
    }
  }

  private async toggleService(payload: ServiceTogglePayload): Promise<void> {
    const service = this.services[payload.serviceId as keyof ServiceConfig];
    if (service) {
      service.enabled = payload.enabled;
      await this.saveUserPreferences();

      // If disabling service and tab is open, optionally close it
      if (!payload.enabled && service.tabId) {
        // Could implement auto-close here if desired
      }
    }
  }

  private async closeTab(serviceId: string): Promise<void> {
    const service = this.services[serviceId as keyof ServiceConfig];
    if (service && service.tabId) {
      try {
        await chrome.tabs.remove(service.tabId);
        service.tabId = undefined;
        service.status = 'disconnected';
      } catch (error) {
        console.error(`Failed to close tab for ${service.name}:`, error);
      }
    }
  }

  private async closeAllTabs(): Promise<void> {
    const tabIds: number[] = [];

    // First collect tracked tab IDs
    Object.values(this.services).forEach(service => {
      if (service.tabId) {
        tabIds.push(service.tabId);
        service.tabId = undefined;
        service.status = 'disconnected';
      }
    });

    // Also find any tabs by URL in case tracking is out of sync
    const serviceUrls = Object.values(this.services).map(
      service => service.url + '*',
    );
    const allTabs = await chrome.tabs.query({});

    for (const tab of allTabs) {
      if (
        tab.url &&
        serviceUrls.some(pattern =>
          tab.url!.startsWith(pattern.replace('*', '')),
        )
      ) {
        if (!tabIds.includes(tab.id!)) {
          tabIds.push(tab.id!);
        }
      }
    }

    if (tabIds.length > 0) {
      try {
        await chrome.tabs.remove(tabIds);
      } catch (error) {
        console.error('Failed to close all tabs:', error);
        throw error;
      }
    }
  }

  private async focusTab(serviceId: string): Promise<void> {
    const service = this.services[serviceId as keyof ServiceConfig];
    if (service && service.tabId) {
      try {
        // Focus the tab and bring its window to front
        await chrome.tabs.update(service.tabId, { active: true });
        const tab = await chrome.tabs.get(service.tabId);
        await chrome.windows.update(tab.windowId, { focused: true });
      } catch (error) {
        console.error(`Failed to focus tab for ${service.name}:`, error);
        // If tab doesn't exist anymore, try to open it
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('No tab with id')) {
          await this.openOrFocusTab(service);
        }
      }
    } else if (service) {
      // If tab doesn't exist, open it
      await this.openOrFocusTab(service);
    }
  }

  private handleTabClosed(tabId: number): void {
    // Update service status when tab is manually closed
    Object.values(this.services).forEach(service => {
      if (service.tabId === tabId) {
        service.tabId = undefined;
        service.status = 'disconnected';
      }
    });
  }

  private handleTabUpdated(tabId: number, url: string): void {
    // Update service status when tab is loaded
    Object.values(this.services).forEach(service => {
      if (service.tabId === tabId && url.startsWith(service.url)) {
        service.status = 'connected';
      }
    });
  }

  // Method to get current services state (for popup)
  public getServicesState(): ServiceConfig {
    return this.services;
  }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Export for testing purposes
(globalThis as any).backgroundService = backgroundService;
