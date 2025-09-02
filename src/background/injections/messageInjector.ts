import type { SiteConfig } from '@/types';

interface DebugInfo {
  url: string;
  title: string;
  selectors: string[];
  found: Array<{ selector: string; count: number }>;
  visible: Array<{ selector: string; id: string; className: string }>;
}

export interface InjectionResult {
  success: boolean;
  error?: string;
  details?: {
    elementInfo?: {
      tagName: string;
      id: string;
      className: string;
      selector?: string;
    };
    timing?: {
      timestamp: number;
      method: string;
      waitTime?: number;
    };
    pageInfo?: {
      title: string;
      url: string;
      readyState: string;
    };
    attempts?: number;
    submitted?: boolean;
    stoppedGeneration?: boolean;
  };
}

/**
 * Creates the injection function to be injected into the page
 * This function runs in the page context and performs the actual message injection
 */
export function createMessageInjector() {
  return (message: string, config: SiteConfig): Promise<InjectionResult> => {
    const startTime = Date.now();

    function sleep(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function isVisible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    }

    function findInputElement(): {
      element: Element | null;
      debugInfo: DebugInfo;
    } {
      interface DebugInfo {
        url: string;
        title: string;
        selectors: string[];
        found: Array<{ selector: string; count: number }>;
        visible: Array<{ selector: string; id: string; className: string }>;
      }

      const debugInfo: DebugInfo = {
        url: window.location.href,
        title: document.title,
        selectors: config.inputSelectors,
        found: [],
        visible: [],
      };

      for (const selector of config.inputSelectors) {
        const elements = document.querySelectorAll(selector);
        debugInfo.found.push({ selector, count: elements.length });

        for (const element of elements) {
          if (isVisible(element)) {
            debugInfo.visible.push({
              selector,
              id: element.id,
              className: element.className,
            });
            return { element, debugInfo };
          }
        }
      }

      return { element: null, debugInfo };
    }

    async function clickStopIfPresent(): Promise<boolean> {
      if (!config.stopSelectors || config.stopSelectors.length === 0) {
        return false; // No stop selectors configured
      }

      // First, check if any stop button is present and click it
      let stoppedSomething = false;
      for (const selector of config.stopSelectors) {
        const stopButton = document.querySelector(
          selector,
        ) as HTMLButtonElement;
        if (stopButton && !stopButton.disabled && isVisible(stopButton)) {
          stopButton.click();
          stoppedSomething = true;
          break; // Only click the first available stop button
        }
      }

      if (!stoppedSomething) {
        return false; // No stop button was found to click
      }

      // Wait and poll until stop button disappears or timeout is reached
      const maxWaitTime = 3000; // 5 seconds maximum wait time
      const pollInterval = 200; // Check every 200ms
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        let stopButtonStillPresent = false;

        // Check if any stop button is still visible
        for (const selector of config.stopSelectors) {
          const stopButton = document.querySelector(
            selector,
          ) as HTMLButtonElement;
          if (stopButton && !stopButton.disabled && isVisible(stopButton)) {
            stopButtonStillPresent = true;
            break;
          }
        }

        if (!stopButtonStillPresent) {
          // Stop button has disappeared, we can proceed
          return true;
        }

        // Wait before checking again
        await sleep(pollInterval);
      }

      // Timeout reached but stop button might still be present
      // We'll proceed anyway to avoid infinite waiting
      return true;
    }

    function injectToElement(element: Element, text: string): boolean {
      try {
        (element as HTMLElement).focus();

        if (
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLInputElement
        ) {
          // Standard form elements
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        } else if ((element as HTMLElement).contentEditable === 'true') {
          if (config.injectionMethod === 'execCommand') {
            // Use execCommand for sites like Perplexity
            element.textContent = '';
            (element as HTMLElement).focus();
            document.execCommand('insertText', false, text);
            return true;
          } else {
            // Direct content editing for most sites
            element.textContent = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }

        return false;
      } catch {
        // Injection failed - return false
        return false;
      }
    }

    async function submitMessage(): Promise<boolean> {
      // Wait a moment for UI to update after injection
      await sleep(300);

      // Try submit buttons first - check multiple times as they may become enabled
      for (let attempt = 0; attempt < 3; attempt++) {
        for (const selector of config.submitSelectors) {
          const button = document.querySelector(selector) as HTMLButtonElement;
          if (button && !button.disabled && isVisible(button)) {
            button.click();
            return true;
          }
        }

        // Wait a bit before checking again
        if (attempt < 2) {
          await sleep(200);
        }
      }
      return false;
    }

    // Main injection logic - wrap in async IIFE
    return (async (): Promise<InjectionResult> => {
      try {
        // First, try to stop any ongoing generation if stop selectors are present
        const stoppedGeneration = await clickStopIfPresent();

        const inputResult = findInputElement();
        const inputElement = inputResult.element;

        if (!inputElement) {
          return {
            success: false,
            error: `No visible input element found. Debug: ${JSON.stringify(
              inputResult.debugInfo,
            )}`,
            details: {
              timing: {
                timestamp: Date.now(),
                method: 'findElement',
                waitTime: Date.now() - startTime,
              },
              pageInfo: {
                title: document.title,
                url: window.location.href,
                readyState: document.readyState,
              },
            },
          };
        }

        const injected = injectToElement(inputElement, message);

        if (!injected) {
          return {
            success: false,
            error: 'Failed to inject message into element',
            details: {
              elementInfo: {
                tagName: inputElement.tagName,
                id: inputElement.id,
                className: inputElement.className,
              },
              timing: {
                timestamp: Date.now(),
                method: config.injectionMethod || 'default',
                waitTime: Date.now() - startTime,
              },
            },
          };
        }

        // Wait a moment for the injection to register
        await sleep(200);

        // Submit the message
        const submitted = await submitMessage();

        if (!submitted) {
          return {
            success: false,
            error: 'Message injected but could not find enabled submit button',
            details: {
              elementInfo: {
                tagName: inputElement.tagName,
                id: inputElement.id,
                className: inputElement.className,
                selector:
                  config.inputSelectors.find((sel: string) =>
                    inputElement.matches(sel),
                  ) || 'unknown',
              },
              timing: {
                timestamp: Date.now(),
                method: config.injectionMethod || 'default',
                waitTime: Date.now() - startTime,
              },
              pageInfo: {
                title: document.title,
                url: window.location.href,
                readyState: document.readyState,
              },
              submitted: false,
              stoppedGeneration,
            },
          };
        }

        return {
          success: true,
          details: {
            elementInfo: {
              tagName: inputElement.tagName,
              id: inputElement.id,
              className: inputElement.className,
              selector:
                config.inputSelectors.find((sel: string) =>
                  inputElement.matches(sel),
                ) || 'unknown',
            },
            timing: {
              timestamp: Date.now(),
              method: config.injectionMethod || 'default',
              waitTime: Date.now() - startTime,
            },
            pageInfo: {
              title: document.title,
              url: window.location.href,
              readyState: document.readyState,
            },
            submitted,
            stoppedGeneration,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
          details: {
            timing: {
              timestamp: Date.now(),
              method: 'error',
              waitTime: Date.now() - startTime,
            },
          },
        };
      }
    })();
  };
}
