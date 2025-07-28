import { ContentMessage } from '../shared/types';
import { CONTENT_MESSAGE_TYPES } from '../shared/constants';
import { getServiceByHostname, ServiceConfig } from '../shared/serviceConfig';
import { logger } from '../shared/logger';
import { InjectionHandler } from './modules/InjectionHandler';
import { ReadinessChecker } from './modules/ReadinessChecker';

class ContentScript {
  private currentServiceConfig: ServiceConfig | null = null;
  private injectionHandler: InjectionHandler | null = null;
  private readinessChecker: ReadinessChecker | null = null;

  constructor() {
    this.detectService();
    this.initializeModules();
    this.initializeListeners();
  }

  private detectService(): void {
    const hostname = window.location.hostname;
    this.currentServiceConfig = getServiceByHostname(hostname);
  }

  private initializeModules(): void {
    if (!this.currentServiceConfig) return;

    this.injectionHandler = new InjectionHandler(this.currentServiceConfig);
    this.readinessChecker = new ReadinessChecker(
      this.currentServiceConfig,
      () => this.injectionHandler?.findInputElement() || null,
    );
  }

  private initializeListeners(): void {
    if (!this.currentServiceConfig) return;

    chrome.runtime.onMessage.addListener(
      (
        message: ContentMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
      ) => {
        this.handleMessage(message, sendResponse);
        return true; // Keep message channel open
      },
    );

    // Initialize readiness checking
    this.readinessChecker?.initializeReadinessCheck();
  }

  private async handleMessage(
    message: ContentMessage,
    sendResponse: (response?: unknown) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case CONTENT_MESSAGE_TYPES.INJECT_MESSAGE:
          if (message.payload?.message && this.injectionHandler) {
            const success = await this.injectionHandler.injectMessage(
              message.payload.message,
            );
            sendResponse({ success, service: this.currentServiceConfig?.id });
          }
          break;

        case CONTENT_MESSAGE_TYPES.STATUS_CHECK:
          if (this.readinessChecker) {
            // Use enhanced input detection with retries
            const isInputReady = await this.readinessChecker.checkInputWithRetries();
            sendResponse({
              ready: isInputReady,
              service: this.currentServiceConfig?.id,
              url: window.location.href,
            });
          }
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error(`AI Hub Content Script error:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({ success: false, error: errorMessage });
    }
  }
}

// Initialize content script
if (typeof window !== 'undefined') {
  new ContentScript();
}
