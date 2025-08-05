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

class BackgroundSite {
  private tabManager: TabManager;
  private messageHandler: MessageHandler;
  private siteManager: SiteManager;

  constructor() {
    this.siteManager = new SiteManager();
    this.tabManager = new TabManager(this.siteManager.sites);
    this.messageHandler = new MessageHandler(
      this.siteManager.sites,
      this.tabManager,
    );
    this.initializeListeners();
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

  private async handleMessage(
    message: ExtensionMessage,
    sendResponse: (response: Response) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case EXTENSION_MESSAGE_TYPES.SEND_MESSAGE:
          await this.messageHandler.sendMessageToSitesRobust(
            message.payload as SendMessagePayload,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.SITE_TOGGLE:
          await this.siteManager.toggleSite(
            message.payload as SiteTogglePayload,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.FOCUS_TAB:
          await this.tabManager.focusTab(
            (message.payload as { siteId: string }).siteId,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS:
          await this.tabManager.closeAllTabs();
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.UPDATE_SITE_CONFIGS:
          this.siteManager.initializeSitesFromConfigs(
            message.payload as SiteConfigsPayload,
          );
          // Update TabManager with new site configurations
          this.tabManager = new TabManager(this.siteManager.sites);
          this.messageHandler = new MessageHandler(
            this.siteManager.sites,
            this.tabManager,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.GET_SITE_CONFIGS:
          sendResponse({
            success: true,
            data: { configs: this.siteManager.sites },
          });
          break;

        case EXTENSION_MESSAGE_TYPES.GET_SITE_BY_HOSTNAME:
          if (
            message.payload &&
            typeof message.payload === 'object' &&
            'hostname' in message.payload
          ) {
            const hostname = (message.payload as { hostname: string }).hostname;
            const config = this.siteManager.getSiteByHostname(hostname);
            sendResponse({
              success: true,
              config: config,
            });
          } else {
            sendResponse({ success: false, error: 'Hostname is required' });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error('BackgroundSite error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({ success: false, error: errorMessage });
    }
  }
}

// Initialize background site
new BackgroundSite();
