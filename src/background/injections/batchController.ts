import type { SiteConfig } from '@/types';
import type { InjectionResult } from './messageInjector';
import { browser } from '#imports';
import { logger } from '@/shared';
import { CONFIG } from '@/shared';

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
   * Execute message injection on multiple tabs in parallel using smart injection
   */
  async executeBatch(
    message: string,
    injections: BatchInjectionConfig[],
    injectionFunction: (
      message: string,
      config: SiteConfig,
    ) => Promise<InjectionResult>,
    maxRetries = 5,
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
   * Execute injection on a single tab with simple retry logic using smart injector
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
    const { baseDelay } = CONFIG.background.messageRetry;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(
          `Attempting smart injection to tab ${tabId} (attempt ${attempt}/${maxRetries})`,
        );

        const results = await browser.scripting.executeScript({
          target: { tabId },
          func: injectionFunction,
          args: [message, siteConfig],
        });

        const injectionResult = results[0]?.result as InjectionResult;
        if (injectionResult) {
          if (injectionResult.success) {
            logger.debug(
              `Successfully injected message to tab ${tabId} on attempt ${attempt}`,
              injectionResult.details,
            );
          } else {
            logger.debug(
              `Injection failed for tab ${tabId} on attempt ${attempt}:`,
              injectionResult.error,
            );
          }

          return { tabId, result: injectionResult };
        }

        throw new Error('No result returned from smart injection script');
      } catch (error) {
        lastError = error as Error;
        logger.debug(
          `Smart injection attempt ${attempt} failed for tab ${tabId}:`,
          error,
        );

        // Wait before retrying (simple linear backoff)
        if (attempt < maxRetries) {
          const delay = baseDelay * attempt;
          logger.debug(
            `Waiting ${delay}ms before retry ${attempt + 1} for tab ${tabId}`,
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    const errorMessage = `Smart injection failed after ${maxRetries} attempts: ${
      lastError?.message || 'Unknown error'
    }`;
    logger.error(`Smart injection failed for tab ${tabId}: ${errorMessage}`);

    return {
      tabId,
      result: {
        success: false,
        error: errorMessage,
        details: {
          pageInfo: {
            title: 'Unknown',
            url: 'Unknown',
            readyState: 'Unknown',
          },
          timing: {
            timestamp: Date.now(),
            method: 'RETRY_FAILED',
          },
        },
      } as InjectionResult,
    };
  }

  /**
   * Helper function for delays between retries
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
