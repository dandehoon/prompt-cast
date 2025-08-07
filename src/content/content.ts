import type { ContentMessage } from '../types/messages';
import {
  CONTENT_MESSAGE_TYPES,
  EXTENSION_MESSAGE_TYPES,
} from '../shared/constants';
import type { SiteConfig } from '../types/site';
import { logger } from '../shared/logger';
import { InjectionHandler } from './modules/InjectionHandler';
import { ReadinessChecker } from './modules/ReadinessChecker';

class ContentScript {
  private currentSiteConfig: SiteConfig | null = null;
  private injectionHandler: InjectionHandler | null = null;
  private readinessChecker: ReadinessChecker | null = null;

  constructor() {
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    await this.detectSite();
    this.initializeModules();
    this.initializeListeners();
  }

  private async detectSite(): Promise<void> {
    const hostname = window.location.hostname;

    try {
      // Get site config from background script
      const response = await chrome.runtime.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.GET_SITE_BY_HOSTNAME,
        payload: { hostname },
      });

      if (response?.config) {
        this.currentSiteConfig = response.config;
      }
    } catch (error) {
      logger.error('Failed to get site config from background:', error);
    }
  }

  private initializeModules(): void {
    if (!this.currentSiteConfig) return;

    this.injectionHandler = new InjectionHandler(this.currentSiteConfig);
    this.readinessChecker = new ReadinessChecker(
      this.currentSiteConfig,
      () => this.injectionHandler?.findInputElement() || null,
    );
  }

  private initializeListeners(): void {
    if (!this.currentSiteConfig) return;

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

            sendResponse({
              success,
              site: this.currentSiteConfig?.id,
              timestamp: Date.now(),
              messageLength: message.payload.message.length,
            });
          } else {
            logger.error(
              'Invalid message payload or injection handler not ready',
            );
            sendResponse({
              success: false,
              error: 'Invalid message payload or injection handler not ready',
              site: this.currentSiteConfig?.id,
            });
          }
          break;

        case CONTENT_MESSAGE_TYPES.STATUS_CHECK:
          if (this.readinessChecker) {
            // Use enhanced input detection with retries
            const isInputReady =
              await this.readinessChecker.checkInputWithRetries();

            sendResponse({
              ready: isInputReady,
              site: this.currentSiteConfig?.id,
              url: window.location.href,
              timestamp: Date.now(),
            });
          } else {
            logger.error('Readiness checker not initialized');
            sendResponse({
              ready: false,
              error: 'Readiness checker not initialized',
              site: this.currentSiteConfig?.id,
              url: window.location.href,
            });
          }
          break;

        default:
          logger.error(`Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      logger.error(`AI Hub Content Script error:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({
        success: false,
        error: errorMessage,
        site: this.currentSiteConfig?.id,
      });
    }
  }
}

// Initialize content script
if (typeof window !== 'undefined') {
  new ContentScript();
}
