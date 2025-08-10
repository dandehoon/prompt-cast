import type { SiteConfig } from '../types/siteConfig';
import { CONFIG } from '../shared/config';
import { sleep } from '../shared/utils';
import { logger } from '../shared/logger';

export class ReadinessChecker {
  constructor(
    private siteConfig: SiteConfig,
    private findInputElement: () => Element | null,
  ) {}

  async checkInputWithRetries(maxAttempts?: number): Promise<boolean> {
    const attempts = maxAttempts ?? CONFIG.content.input.maxReadinessAttempts;
    const { detectionDelay } = CONFIG.content.input;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const inputElement = this.findInputElement();
      if (inputElement) {
        return true;
      }

      // Wait between attempts for faster response
      await sleep(detectionDelay);
    }

    return false;
  }

  initializeReadinessCheck(): void {
    // Check input readiness after page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.checkInputReady();
        this.setupDOMObserver(); // Add DOM observer for dynamic content
      });
    } else {
      this.checkInputReady();
      this.setupDOMObserver(); // Add DOM observer for dynamic content
    }
  }

  private checkInputReady(): void {
    const { maxPollingAttempts, pollingInterval } = CONFIG.content.polling;
    let attempts = 0;

    const check = setInterval(() => {
      attempts++;
      const inputElement = this.findInputElement();

      if (inputElement || attempts >= maxPollingAttempts) {
        clearInterval(check);

        // Optional: Could notify background script about input readiness
        // We skip this since it's not critical for the migration
        logger.debug(
          `Input readiness check completed after ${attempts} attempts`,
        );
      }
    }, pollingInterval);
  }

  private setupDOMObserver(): void {
    // Set up a MutationObserver to detect when input elements are added dynamically
    // This is especially useful for ChatGPT which loads content dynamically
    if (typeof window.MutationObserver === 'undefined') return;

    const observer = new window.MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes or their children contain input elements
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === window.Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if this element or its children match our input selectors
              const hasInputElement = this.siteConfig.inputSelectors.some(
                (selector) => {
                  return (
                    element.matches &&
                    (element.matches(selector) ||
                      element.querySelector(selector))
                  );
                },
              );

              if (hasInputElement) {
                // Found input element, stop observing
                observer.disconnect();
                logger.debug(
                  `Input element dynamically detected for ${this.siteConfig.name}`,
                );
                return;
              }
            }
          }
        }
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Stop observing after timeout to prevent memory leaks
    setTimeout(() => {
      observer.disconnect();
    }, CONFIG.content.observer.timeout);
  }
}
