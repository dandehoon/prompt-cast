import type { SiteConfig } from '@/types';
import { browser } from '#imports';
import {
  createMessageInjector,
  type BatchInjectionConfig,
  type BatchInjectionResult,
  type InjectionResult,
} from './injections';

/**
 * ExecuteScriptInjector using message injection approach with DOM waiting and retry logic
 */
export class ExecuteScriptInjector {
  private messageInjector: (
    message: string,
    config: SiteConfig,
  ) => Promise<InjectionResult>;

  constructor() {
    this.messageInjector = createMessageInjector();
  }

  /**
   * Execute batch injection using message injection approach with DOM waiting
   */
  async batchInject(
    message: string,
    injections: BatchInjectionConfig[],
    maxRetries = 5,
  ): Promise<BatchInjectionResult[]> {
    // Execute injections for each tab with retry logic
    const promises = injections.map(async (injection) => {
      return this.executeWithRetry(message, injection, maxRetries);
    });

    return Promise.all(promises);
  }

  /**
   * Execute injection with retry logic
   */
  private async executeWithRetry(
    message: string,
    injection: BatchInjectionConfig,
    maxRetries: number,
  ): Promise<BatchInjectionResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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

        // Wait before retrying (simple linear backoff)
        if (attempt < maxRetries) {
          const delay = 1000 * attempt; // 1s, 2s, 3s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = 1000 * attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
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
