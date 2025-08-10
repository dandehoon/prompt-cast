import { onContentMessage } from './messaging';
import { sendMessage } from '@/shared';
import type { SiteConfig } from '@/types';
import { logger } from '@/shared';
import { InjectionHandler } from './injectionHandler';
import { ReadinessChecker } from './readinessChecker';

export class ContentScript {
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
      // Get site config from background script using webext-core messaging
      const response = await sendMessage('GET_SITE_BY_HOSTNAME', { hostname });

      if (response?.config) {
        this.currentSiteConfig = response.config;
        logger.debug(`Detected site: ${this.currentSiteConfig.name}`);
      } else {
        logger.debug(`No site configuration found for hostname: ${hostname}`);
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

    // Set up webext-core content message listeners
    onContentMessage('STATUS_CHECK', async () => {
      if (this.readinessChecker) {
        // Use enhanced input detection with retries
        const isInputReady =
          await this.readinessChecker.checkInputWithRetries();
        return {
          ready: Boolean(isInputReady),
        };
      } else {
        return {
          ready: false,
        };
      }
    });

    onContentMessage('INJECT_MESSAGE', async (message) => {
      if (message.data?.message && this.injectionHandler) {
        try {
          const success = await this.injectionHandler.injectMessage(
            message.data.message,
          );
          return {
            success,
          };
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown injection error';
          return {
            success: false,
            error: errorMessage,
          };
        }
      } else {
        return {
          success: false,
          error: 'Invalid message payload or injection handler not ready',
        };
      }
    });

    // Initialize readiness checking
    this.readinessChecker?.initializeReadinessCheck();
  }
}
