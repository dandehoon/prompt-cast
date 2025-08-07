import type {
  ExtensionMessage,
  SendMessagePayload,
  SiteTogglePayload,
  SiteConfigsPayload,
  Response,
} from '../types';
import { EXTENSION_MESSAGE_TYPES } from '../shared/constants';
import { logger } from '../shared/logger';
import { TabManager } from './modules/TabManager';
import { MessageHandler } from './modules/MessageHandler';
import { SiteManager } from './modules/SiteManager';

type MessageHandlerMethod = (payload?: unknown) => Promise<unknown>;

type MessageHandlerRegistry = {
  [K in keyof typeof EXTENSION_MESSAGE_TYPES]: MessageHandlerMethod;
};

class BackgroundSite {
  private tabManager: TabManager;
  private messageHandler: MessageHandler;
  private siteManager: SiteManager;
  private messageHandlers: MessageHandlerRegistry;

  constructor() {
    this.siteManager = new SiteManager();
    this.tabManager = new TabManager(this.siteManager.sites);
    this.messageHandler = new MessageHandler(
      this.siteManager.sites,
      this.tabManager,
    );
    this.messageHandlers = this.createMessageHandlers();
    this.initializeListeners();
  }

  private createMessageHandlers(): MessageHandlerRegistry {
    return {
      SEND_MESSAGE: this.handleSendMessage.bind(this),
      SITE_TOGGLE: this.handleSiteToggle.bind(this),
      FOCUS_TAB: this.handleFocusTab.bind(this),
      CLOSE_ALL_TABS: this.handleCloseAllTabs.bind(this),
      UPDATE_SITE_CONFIGS: this.handleUpdateSiteConfigs.bind(this),
      GET_SITE_CONFIGS: this.handleGetSiteConfigs.bind(this),
      GET_SITE_BY_HOSTNAME: this.handleGetSiteByHostname.bind(this),
    };
  }

  private createErrorResponse(error: unknown, context: string): Response {
    const errorMessage =
      error instanceof Error ? error.message : `Failed to ${context}`;
    logger.error(`${context} error:`, error);
    return { success: false, error: errorMessage };
  }

  private async executeWithErrorHandling(
    handler: MessageHandlerMethod,
    payload: unknown,
    context: string,
  ): Promise<Response> {
    try {
      const result = await handler(payload);
      return result
        ? { success: true, ...(typeof result === 'object' ? result : {}) }
        : { success: true };
    } catch (error) {
      return this.createErrorResponse(error, context);
    }
  }

  private initializeListeners(): void {
    chrome.runtime.onMessage.addListener(
      (
        message: ExtensionMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: Response) => void,
      ) => {
        this.handleMessage(message, sendResponse);
        return true; // Keep message channel open
      },
    );

    // Note: No need to track tab removal since we query Chrome directly for tab state
  }

  // Individual message handlers
  private async handleSendMessage(payload: unknown): Promise<void> {
    await this.messageHandler.sendMessageToSitesRobust(
      payload as SendMessagePayload,
    );
  }

  private async handleSiteToggle(payload: unknown): Promise<void> {
    await this.siteManager.toggleSite(payload as SiteTogglePayload);
  }

  private async handleFocusTab(payload: unknown): Promise<void> {
    await this.tabManager.focusTab((payload as { siteId: string }).siteId);
  }

  private async handleCloseAllTabs(): Promise<void> {
    await this.tabManager.closeAllTabs();
  }

  private async handleUpdateSiteConfigs(payload: unknown): Promise<void> {
    this.siteManager.initializeSitesFromConfigs(payload as SiteConfigsPayload);
    // Update TabManager with new site configurations
    this.tabManager = new TabManager(this.siteManager.sites);
    this.messageHandler = new MessageHandler(
      this.siteManager.sites,
      this.tabManager,
    );
  }

  private async handleGetSiteConfigs(): Promise<{
    data: { configs: Record<string, import('../types').SiteConfig> };
  }> {
    return { data: { configs: this.siteManager.sites } };
  }

  private async handleGetSiteByHostname(
    payload: unknown,
  ): Promise<{ config: import('../types').SiteConfig | null }> {
    if (payload && typeof payload === 'object' && 'hostname' in payload) {
      const hostname = (payload as { hostname: string }).hostname;
      const config = this.siteManager.getSiteByHostname(hostname);
      return { config };
    } else {
      throw new Error('Hostname is required');
    }
  }

  private async handleMessage(
    message: ExtensionMessage,
    sendResponse: (response: Response) => void,
  ): Promise<void> {
    const handler =
      this.messageHandlers[
        message.type as keyof typeof EXTENSION_MESSAGE_TYPES
      ];

    if (!handler) {
      sendResponse({ success: false, error: 'Unknown message type' });
      return;
    }

    const response = await this.executeWithErrorHandling(
      handler,
      message.payload,
      message.type.toLowerCase().replace(/_/g, ' '),
    );

    sendResponse(response);
  }
}

// Initialize background site
new BackgroundSite();
