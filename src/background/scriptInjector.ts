import type { SiteConfig } from '@/types';
import { browser } from '#imports';
import {
  createMessageInjector,
  type BatchInjectionConfig,
  type BatchInjectionResult,
  type InjectionResult,
} from './injections';
import { logger } from '@/shared';
import type { TabManager } from './tabManager';

/**
 * ExecuteScriptInjector using message injection approach with DOM waiting and retry logic
 */
export class ExecuteScriptInjector {
  private messageInjector: (
    message: string,
    config: SiteConfig,
  ) => Promise<InjectionResult>;

  constructor(private tabManager: TabManager) {
    this.messageInjector = createMessageInjector();
  }

  /**
   * Execute batch injection using message injection approach with DOM waiting
   */
  async batchInject(
    message: string,
    injections: BatchInjectionConfig[],
  ): Promise<BatchInjectionResult[]> {
    // Execute injections for each tab with retry logic
    const promises = injections.map(async (injection) => {
      return this.executeWithRetry(message, injection);
    });

    return Promise.all(promises);
  }

  /**
   * Execute injection with retry logic
   */
  private async executeWithRetry(
    message: string,
    injection: BatchInjectionConfig,
  ): Promise<BatchInjectionResult> {
    let lastError: Error | null = null;
    const maxRetries = 5;
    const checkInterval = 1000; // Check every 1000ms

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check if tab URL still matches site config before attempting injection
        const isTabInContext = await this.tabManager.isTabIdInChatContext(
          injection.tabId,
          injection.siteConfig,
        );
        if (!isTabInContext) {
          return {
            tabId: injection.tabId,
            result: {
              success: false,
              error: `Tab has navigated away from expected site (${injection.siteConfig.name}) or is no longer accessible`,
            } as InjectionResult,
          };
        }

        const results = await browser.scripting.executeScript({
          target: { tabId: injection.tabId },
          func: this.messageInjector,
          args: [message, injection.siteConfig],
        });

        const result = results[0]?.result;
        if (!result) {
          throw new Error('No result returned from injection script');
        }

        if (result.success) {
          return { tabId: injection.tabId, result };
        }

        // If not successful, we'll retry
        lastError = new Error(result.error || 'Injection failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
      // Wait before retrying
      if (attempt < maxRetries) {
        logger.debug(
          `Retrying injection for tab ${injection.tabId} (attempt ${attempt})`,
        );
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
      }
    }

    // All retries failed
    return {
      tabId: injection.tabId,
      result: {
        success: false,
        error: `Injection failed after ${maxRetries} attempts: ${
          lastError?.message || 'Unknown error'
        }`,
      } as InjectionResult,
    };
  }
}
