import {
  AIService,
  ServiceConfig,
  ExtensionMessage,
  ContentMessage,
  SendMessagePayload,
  ServiceTogglePayload,
  UserPreferences,
  Response,
} from '../shared/types';
import {
  EXTENSION_MESSAGE_TYPES,
  CONTENT_MESSAGE_TYPES,
} from '../shared/constants';
import { SERVICE_CONFIGS } from '../shared/serviceConfig';
import { CONFIG } from '../shared/config';
import { sleep } from '../shared/utils';
import { logger } from '../shared/logger';

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
        sendResponse: (response?: Response) => void,
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
    sendResponse: (response?: Response) => void,
  ): Promise<void> {
    logger.info(
      `Background received message: ${message.type}`,
      message.payload,
    );
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
          await this.closeTab(
            (message.payload as { serviceId: string }).serviceId,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS:
          await this.closeAllTabs();
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.FOCUS_TAB:
          await this.focusTab(
            (message.payload as { serviceId: string }).serviceId,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.TAB_STATUS_UPDATE:
          // Handle status updates from content scripts
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error('Background script error:', error);
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
        Object.keys(this.services).forEach((serviceId) => {
          const typedServiceId = serviceId as keyof ServiceConfig;
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
        const typedServiceId = serviceId as keyof ServiceConfig;
        preferences.services[typedServiceId] = {
          enabled: this.services[typedServiceId].enabled,
        };
      });

      await chrome.storage.sync.set({ userPreferences: preferences });
    } catch (error) {
      logger.error('Failed to save user preferences:', error);
    }
  }

  private async openAllTabs(): Promise<void> {
    const enabledServices = Object.entries(this.services).filter(
      ([_, service]) => service.enabled,
    );

    // Open all tabs concurrently
    const openPromises = enabledServices.map(([_serviceId, service]) =>
      this.openOrFocusTab(service, false).catch((error) => {
        logger.error(`Failed to open tab for ${service.name}:`, error);
        return null;
      }),
    );

    await Promise.all(openPromises);
  }

  private async openOrFocusTab(
    service: AIService,
    shouldFocus: boolean = false,
  ): Promise<void> {
    logger.info(
      `openOrFocusTab called for ${service.name}, shouldFocus: ${shouldFocus}`,
    );
    try {
      // Check if tab already exists
      const existingTabs = await chrome.tabs.query({ url: service.url + '*' });
      logger.info(
        `Found ${existingTabs.length} existing tabs for ${service.name}`,
      );

      if (existingTabs.length > 0) {
        // Focus existing tab
        const tab = existingTabs[0];
        logger.info(`Focusing existing tab ${tab.id} for ${service.name}`);
        await chrome.tabs.update(tab.id!, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });

        // Update service with existing tab ID
        service.tabId = tab.id;
        service.status = 'connected';
        logger.info(`Successfully focused existing tab for ${service.name}`);
      } else {
        // Create new tab - set active based on shouldFocus directly
        logger.info(
          `Creating new tab for ${service.name}, active: ${shouldFocus}`,
        );
        const tab = await chrome.tabs.create({
          url: service.url,
          active: shouldFocus,
        });
        logger.info(`Created new tab ${tab.id} for ${service.name}`);

        service.tabId = tab.id;
        service.status = 'loading';

        // If focusing, also ensure window is focused
        if (shouldFocus) {
          logger.info(`Bringing window to front for new tab ${tab.id}`);
          await chrome.windows.update(tab.windowId, { focused: true });
        }

        // Wait for the tab to fully load
        logger.info(`Waiting for tab ${tab.id} to be ready`);
        await this.waitForTabReady(tab.id!);
        service.status = 'connected';
        logger.info(`Tab ${tab.id} is ready for ${service.name}`);
      }
    } catch (error) {
      logger.error(`Failed to open/focus tab for ${service.name}:`, error);
      service.status = 'error';
    }
  }

  private async sendMessageToServicesRobust(
    payload: SendMessagePayload,
  ): Promise<void> {
    // First, ensure all tabs are open and ready
    await this.openAllTabs();

    // Focus the first service that's available immediately after opening tabs
    await this.focusFirstAvailableService(payload);

    // Remove hardcoded delays - let content script readiness detection handle timing
    // Now send messages to all services immediately
    await this.sendMessageToServices(payload);
  }

  private async focusFirstAvailableService(payload: SendMessagePayload): Promise<void> {
    // Check if any AI service tab is already active/focused
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    let currentlyFocusedService: string | null = null;

    if (currentTab[0]) {
      const currentUrl = currentTab[0].url || '';
      // Check if current tab belongs to any AI service that's in the enabled list for this message
      for (const serviceId of payload.services) {
        const service = this.services[serviceId as keyof ServiceConfig];
        if (service && service.enabled && currentUrl.includes(service.url.split('/')[2])) {
          currentlyFocusedService = serviceId;
          logger.info(`Current tab is ${serviceId} which is in the message target list`);
          break;
        }
      }
    }

    // Only focus if no AI service is currently focused
    if (!currentlyFocusedService) {
      // Focus the first service that has an open tab (not waiting for connection status)
      const enabledServices = payload.services.filter(
        (serviceId) => this.services[serviceId as keyof ServiceConfig]?.enabled,
      );
      
      for (const serviceId of enabledServices) {
        const service = this.services[serviceId as keyof ServiceConfig];
        if (service && service.tabId) {
          logger.info(`Focusing first available service: ${serviceId}`);
          await this.focusTab(serviceId);
          break;
        }
      }
    } else {
      logger.info(`Not switching focus - ${currentlyFocusedService} is already active`);
    }
  }
  private async sendMessageToServices(
    payload: SendMessagePayload,
  ): Promise<void> {
    const enabledServices = payload.services.filter(
      (serviceId) => this.services[serviceId as keyof ServiceConfig]?.enabled,
    );

    // Process all services concurrently
    const sendPromises = enabledServices.map((serviceId) =>
      this.sendToSingleService(serviceId, payload.message),
    );

    // Wait for all to complete
    const results = await Promise.allSettled(sendPromises);

    // Log results (only errors)
    results.forEach((result, index) => {
      const serviceId = enabledServices[index];
      if (result.status === 'rejected') {
        logger.error(`Failed to send message to ${serviceId}:`, result.reason);
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
        await this.openOrFocusTab(service, false);
        // Query again after opening
        tabs = await chrome.tabs.query({ url: service.url + '*' });
      }

      if (tabs.length > 0) {
        const tab = tabs[0];
        service.tabId = tab.id;

        // Wait for tab to be fully loaded and content script ready
        await this.waitForContentScriptReady(tab.id!);

        // Try to send message with retry logic
        await this.sendMessageWithRetry(tab.id!, {
          type: CONTENT_MESSAGE_TYPES.INJECT_MESSAGE,
          payload: { message },
        });

        service.status = 'connected';
      } else {
        service.status = 'disconnected';
        service.tabId = undefined;
        throw new Error(`Failed to open or find ${service.name} tab`);
      }
    } catch (error) {
      logger.error(`Failed to send message to ${service.name}:`, error);
      service.status = 'error';
      service.tabId = undefined;
      throw error;
    }
  }

  private async waitForContentScriptReady(tabId: number): Promise<void> {
    // First wait for tab to be ready
    await this.waitForTabReady(tabId);

    // Then check if content script is responding with optimized timing
    const { maxReadinessAttempts, readinessCheckDelay } =
      CONFIG.background.contentScript;

    for (let attempt = 1; attempt <= maxReadinessAttempts; attempt++) {
      try {
        const response = await chrome.tabs.sendMessage(tabId, {
          type: CONTENT_MESSAGE_TYPES.STATUS_CHECK,
        });

        if (response && response.ready) {
          logger.info(
            `Content script ready for tab ${tabId} after ${attempt} attempts`,
          );
          return;
        }

        logger.info(
          `Content script not ready for tab ${tabId}, attempt ${attempt}/${maxReadinessAttempts}`,
        );

        // If not ready, wait before next attempt
        if (attempt < maxReadinessAttempts) {
          await sleep(readinessCheckDelay);
        }
      } catch (error) {
        logger.warn(
          `Content script check failed for tab ${tabId}, attempt ${attempt}/${maxReadinessAttempts}:`,
          error,
        );

        // For Gemini and other services that might take longer, try injecting content script manually
        if (attempt === Math.floor(maxReadinessAttempts / 2)) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['dist/content/content.js'],
            });
            logger.info(`Manually injected content script for tab ${tabId}`);
          } catch (injectError) {
            logger.warn(
              `Failed to manually inject content script for tab ${tabId}:`,
              injectError,
            );
          }
        }

        // Content script might not be loaded yet, wait and retry
        if (attempt < maxReadinessAttempts) {
          await sleep(readinessCheckDelay);
        } else {
          logger.error(
            `Content script failed to respond after ${maxReadinessAttempts} attempts for tab ${tabId}`,
          );
          // Proceed anyway after max attempts - content script might still work
        }
      }
    }
  }

  private async waitForTabReady(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const { maxReadyAttempts, readyCheckInterval } = CONFIG.background.tab;

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
          } else if (attempts < maxReadyAttempts) {
            // Max 10 seconds, but with faster polling
            setTimeout(() => checkReady(attempts + 1), readyCheckInterval);
          } else {
            resolve(); // Give up after max attempts
          }
        } catch {
          resolve(); // Tab might be closed, just resolve
        }
      };

      checkReady();
    });
  }

  private async sendMessageWithRetry(
    tabId: number,
    message: ContentMessage,
    maxRetries?: number,
  ): Promise<void> {
    const {
      maxRetries: defaultMaxRetries,
      baseDelay,
      maxDelay,
    } = CONFIG.background.messageRetry;
    const retryCount = maxRetries ?? defaultMaxRetries;

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await chrome.tabs.sendMessage(tabId, message);
        return; // Success
      } catch (error) {
        if (attempt < retryCount) {
          // Wait before retry, with exponential backoff
          const delay = Math.min(attempt * baseDelay, maxDelay);
          await sleep(delay);
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

      logger.info(
        `Service ${payload.serviceId}: enabled=${payload.enabled}, tabId=${service.tabId}`,
      );

      if (payload.enabled) {
        // If enabling service, launch and focus the tab
        try {
          logger.info(`Launching and focusing tab for enabled service ${service.name}`);
          await this.focusTab(payload.serviceId);
        } catch (error) {
          logger.error(`Failed to launch and focus tab for ${service.name}:`, error);
        }
      } else if (service.tabId) {
        // If disabling service and has an open tab, close it
        try {
          logger.info(
            `Closing tab ${service.tabId} for disabled service ${service.name}`,
          );
          await chrome.tabs.remove(service.tabId);
          service.tabId = undefined;
          service.status = 'disconnected';
          logger.info(`Successfully closed tab for ${service.name}`);
        } catch (error) {
          logger.error(`Failed to close tab for ${service.name}:`, error);
        }
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
        logger.error(`Failed to close tab for ${service.name}:`, error);
      }
    }
  }

  private async closeAllTabs(): Promise<void> {
    const tabIds: number[] = [];

    // First collect tracked tab IDs
    Object.values(this.services).forEach((service) => {
      if (service.tabId) {
        tabIds.push(service.tabId);
        service.tabId = undefined;
        service.status = 'disconnected';
      }
    });

    // Also find any tabs by URL in case tracking is out of sync
    const serviceUrls = Object.values(this.services).map(
      (service) => service.url + '*',
    );
    const allTabs = await chrome.tabs.query({});

    for (const tab of allTabs) {
      if (
        tab.url &&
        serviceUrls.some((pattern) =>
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
        logger.error('Failed to close all tabs:', error);
        throw error;
      }
    }
  }

  private async focusTab(serviceId: string): Promise<void> {
    logger.info(`focusTab called for serviceId: ${serviceId}`);
    const service = this.services[serviceId as keyof ServiceConfig];

    if (service && service.tabId) {
      logger.info(`Service has existing tabId: ${service.tabId}`);
      try {
        // Focus the tab and bring its window to front
        await chrome.tabs.update(service.tabId, { active: true });
        const tab = await chrome.tabs.get(service.tabId);
        await chrome.windows.update(tab.windowId, { focused: true });
        logger.info(`Successfully focused existing tab for ${service.name}`);
      } catch (error) {
        logger.error(`Failed to focus tab for ${service.name}:`, error);
        // If tab doesn't exist anymore, try to open it with focus
        const errorMessage = error instanceof Error ? error.message : '';
        if (errorMessage.includes('No tab with id')) {
          logger.info(
            `Tab no longer exists, opening new tab with focus for ${service.name}`,
          );
          await this.openOrFocusTab(service, true);
        }
      }
    } else if (service) {
      logger.info(
        `Service has no tabId, opening new tab with focus for ${service.name}`,
      );
      // If tab doesn't exist, open it with focus
      await this.openOrFocusTab(service, true);
    } else {
      logger.error(`Service not found for serviceId: ${serviceId}`);
    }
  }

  private handleTabClosed(tabId: number): void {
    // Update service status when tab is manually closed
    Object.values(this.services).forEach((service) => {
      if (service.tabId === tabId) {
        service.tabId = undefined;
        service.status = 'disconnected';
      }
    });
  }

  private handleTabUpdated(tabId: number, url: string): void {
    // Update service status when tab is loaded
    Object.values(this.services).forEach((service) => {
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
(globalThis as { backgroundService?: BackgroundService }).backgroundService =
  backgroundService;
