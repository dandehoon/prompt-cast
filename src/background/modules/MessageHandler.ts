import { SendMessagePayload, AIService } from '../../shared/types';
import { logger } from '../../shared/logger';
import { CONTENT_MESSAGE_TYPES } from '../../shared/constants';
import { TabManager } from './TabManager';

export class MessageHandler {
  constructor(
    private services: Record<string, AIService>,
    private tabManager: TabManager,
  ) {}

  async sendMessageToServicesRobust(
    payload: SendMessagePayload,
  ): Promise<void> {
    // First, ensure all tabs are open and ready
    await this.openAllTabsWithInstantFocus(payload);

    // Remove hardcoded delays - let content script readiness detection handle timing
    // Now send messages to all services immediately
    await this.sendMessageToServices(payload);
  }

  private async openAllTabsWithInstantFocus(
    payload: SendMessagePayload,
  ): Promise<void> {
    // Only open tabs for services that are both enabled and requested for this message
    const servicesToOpen = payload.services.filter(
      (serviceId) => this.services[serviceId]?.enabled,
    );

    let focusApplied = false;

    // Check if any AI service tab is already active/focused
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (currentTab[0]) {
      const currentUrl = currentTab[0].url || '';
      // Check if current tab belongs to any AI service that's in the enabled list for this message
      for (const serviceId of servicesToOpen) {
        const service = this.services[serviceId];
        if (
          service &&
          service.enabled &&
          currentUrl.includes(service.url.split('/')[2])
        ) {
          focusApplied = true;
          break;
        }
      }
    }

    // Open only the required tabs concurrently, but focus the first one immediately
    const openPromises = servicesToOpen.map(async (serviceId) => {
      const service = this.services[serviceId];
      if (!service) return;

      await this.tabManager.openOrFocusTab(service, false);

      // Focus the first available service immediately after it opens (if no current focus)
      if (!focusApplied && service.tabId) {
        await this.tabManager.focusTab(serviceId);
        focusApplied = true;
      }
    });

    // Wait for all to complete
    await Promise.allSettled(openPromises);
  }

  private async sendMessageToServices(
    payload: SendMessagePayload,
  ): Promise<void> {
    const enabledServices = payload.services.filter(
      (serviceId) => this.services[serviceId]?.enabled,
    );

    // Process all services concurrently
    const sendPromises = enabledServices.map((serviceId) =>
      this.sendToSingleService(serviceId, payload.message),
    );

    // Wait for all to complete
    const results = await Promise.allSettled(sendPromises);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const serviceId = enabledServices[index];
        logger.error(`Failed to send message to ${serviceId}:`, result.reason);
      }
    });
  }

  private async sendToSingleService(
    serviceId: string,
    message: string,
  ): Promise<void> {
    const service = this.services[serviceId];

    try {
      // First, try to find current tabs for this service
      let tabs = await chrome.tabs.query({ url: service.url + '*' });

      // If no tabs exist, open one first
      if (tabs.length === 0) {
        await this.tabManager.openOrFocusTab(service, false);
        // Query again after opening
        tabs = await chrome.tabs.query({ url: service.url + '*' });
      }

      if (tabs.length > 0) {
        const tab = tabs[0];
        service.tabId = tab.id;

        // Wait for tab to be fully loaded and content script ready
        await this.tabManager.waitForContentScriptReady(tab.id!);

        // Try to send message with retry logic
        await this.tabManager.sendMessageWithRetry(tab.id!, {
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
}
