import { SiteConfig } from '../../shared/siteConfig';
import { CONFIG } from '../../shared/config';
import { sleep } from '../../shared/utils';
import { CONTENT_MESSAGE_TYPES } from '../../shared/constants';

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

        // Notify background script about input readiness (optional)
        try {
          chrome.runtime
            .sendMessage({
              type: CONTENT_MESSAGE_TYPES.INPUT_READY,
              payload: {
                ready: !!inputElement,
                site: this.siteConfig.id,
                attempts,
              },
            })
            .catch(() => {}); // Ignore errors
        } catch {
          // Ignore messaging errors
        }
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
                // Found input element, stop observing and notify
                observer.disconnect();
                try {
                  chrome.runtime
                    .sendMessage({
                      type: CONTENT_MESSAGE_TYPES.INPUT_READY,
                      payload: {
                        ready: true,
                        site: this.siteConfig.id,
                        dynamicallyDetected: true,
                      },
                    })
                    .catch(() => {}); // Ignore errors
                } catch {
                  // Ignore messaging errors
                }
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
