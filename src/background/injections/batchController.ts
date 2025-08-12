import type { SiteConfig } from '@/types';
import type { InjectionResult } from './messageInjector';
import { browser } from '#imports';

export interface BatchInjectionConfig {
  tabId: number;
  siteConfig: SiteConfig;
}

export interface BatchInjectionResult {
  tabId: number;
  result: InjectionResult;
}

/**
 * Handles batch injection to multiple tabs with retry logic and parallel execution
 */
export class BatchInjectionController {
  /**
   * Execute message injection on multiple tabs in parallel
   */
  async executeBatch(
    message: string,
    injections: BatchInjectionConfig[],
    injectionFunction: (
      message: string,
      config: SiteConfig,
    ) => Promise<InjectionResult>,
    maxRetries = 3,
  ): Promise<BatchInjectionResult[]> {
    const promises = injections.map((injection) =>
      this.executeWithRetry(
        injection.tabId,
        injection.siteConfig,
        message,
        injectionFunction,
        maxRetries,
      ),
    );

    return Promise.all(promises);
  }

  /**
   * Execute injection on a single tab with retry logic
   */
  private async executeWithRetry(
    tabId: number,
    siteConfig: SiteConfig,
    message: string,
    injectionFunction: (
      message: string,
      config: SiteConfig,
    ) => Promise<InjectionResult>,
    maxRetries: number,
  ): Promise<BatchInjectionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const results = await browser.scripting.executeScript({
          target: { tabId },
          func: injectionFunction,
          args: [message, siteConfig],
        });

        const result = results[0]?.result as InjectionResult;
        if (result) {
          return { tabId, result };
        }

        throw new Error('No result returned from injection script');
      } catch (error) {
        lastError = error as Error;

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await this.sleep(attempt * 500);
        }
      }
    }

    // All retries failed
    return {
      tabId,
      result: {
        success: false,
        error: `Failed after ${maxRetries} attempts: ${
          lastError?.message || 'Unknown error'
        }`,
      },
    };
  }

  /**
   * Helper function for delays between retries
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
