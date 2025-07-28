import {
  ExtensionMessage,
  SendMessagePayload,
  ServiceTogglePayload,
  Response,
} from '../shared/types';
import { EXTENSION_MESSAGE_TYPES } from '../shared/constants';
import { logger } from '../shared/logger';
import { TabManager } from './modules/TabManager';
import { MessageHandler } from './modules/MessageHandler';
import { ServiceManager } from './modules/ServiceManager';

class BackgroundService {
  private tabManager: TabManager;
  private messageHandler: MessageHandler;
  private serviceManager: ServiceManager;

  constructor() {
    this.serviceManager = new ServiceManager();
    this.tabManager = new TabManager(this.serviceManager.services);
    this.serviceManager.setTabManager(this.tabManager);
    this.messageHandler = new MessageHandler(
      this.serviceManager.services,
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

    // Handle tab closing to update service state
    chrome.tabs.onRemoved.addListener((tabId: number) => {
      Object.values(this.serviceManager.services).forEach((service) => {
        if (service.tabId === tabId) {
          service.tabId = undefined;
          service.status = 'disconnected';
        }
      });
    });
  }

  private async handleMessage(
    message: ExtensionMessage,
    sendResponse: (response: Response) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case EXTENSION_MESSAGE_TYPES.SEND_MESSAGE:
          await this.messageHandler.sendMessageToServicesRobust(
            message.payload as SendMessagePayload,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.SERVICE_TOGGLE:
          await this.serviceManager.toggleService(
            message.payload as ServiceTogglePayload,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.FOCUS_TAB:
          await this.tabManager.focusTab(
            (message.payload as { serviceId: string }).serviceId,
          );
          sendResponse({ success: true });
          break;

        case EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS:
          await this.tabManager.closeAllTabs();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error('BackgroundService error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({ success: false, error: errorMessage });
    }
  }
}

// Initialize background service
new BackgroundService();
