import type { SiteConfig } from '@/types';
import { browser } from '#imports';
import {
  createReadinessChecker,
  createMessageInjector,
  BatchInjectionController,
  type ReadinessResult,
  type InjectionResult,
  type BatchInjectionConfig,
  type BatchInjectionResult,
} from './injections';

/**
 * Simplified ExecuteScriptInjector that orchestrates the injection process
 * using modular injection functions
 */
export class ExecuteScriptInjector {
  private batchController: BatchInjectionController;

  constructor() {
    this.batchController = new BatchInjectionController();
  }

  /**
   * Check if a tab is ready for message injection
   */
  async checkReadiness(
    tabId: number,
    siteConfig: SiteConfig,
  ): Promise<ReadinessResult> {
    try {
      const results = await browser.scripting.executeScript({
        target: { tabId },
        func: createReadinessChecker(),
        args: [siteConfig],
      });

      return results[0]?.result as ReadinessResult;
    } catch (error) {
      return {
        ready: false,
        reason: `executeScript failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Inject a message into a single tab
   */
  async injectMessage(
    tabId: number,
    message: string,
    siteConfig: SiteConfig,
  ): Promise<InjectionResult> {
    try {
      const results = await browser.scripting.executeScript({
        target: { tabId },
        func: createMessageInjector(),
        args: [message, siteConfig],
      });

      return results[0]?.result as InjectionResult;
    } catch (error) {
      return {
        success: false,
        error: `executeScript failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Inject message into multiple tabs in parallel with retry logic
   */
  async batchInject(
    message: string,
    injections: BatchInjectionConfig[],
    maxRetries = 3,
  ): Promise<BatchInjectionResult[]> {
    return this.batchController.executeBatch(
      message,
      injections,
      createMessageInjector(),
      maxRetries,
    );
  }
}
