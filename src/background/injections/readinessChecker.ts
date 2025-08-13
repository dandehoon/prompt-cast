import type { SiteConfig } from '@/types';

export interface ReadinessResult {
  ready: boolean;
  reason?: string;
  details?: {
    pageState?: {
      readyState: string;
      title: string;
      url: string;
      timestamp: number;
    };
    inputElement?: {
      found: boolean;
      selector?: string;
      visible?: boolean;
      id?: string;
      className?: string;
    };
    submitButtons?: Array<{
      selector: string;
      visible: boolean;
      disabled: boolean;
    }>;
    siteConfig?: {
      name: string;
      id: string;
      inputSelectors: string[];
      submitSelectors: string[];
    };
  };
}

/**
 * Creates a readiness checking function to be injected into the page
 * This function runs in the page context and checks if the site is ready for injection
 */
export function createReadinessChecker() {
  return (config: SiteConfig): ReadinessResult => {
    function isElementVisible(element: Element): boolean {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    }

    function findInputElement() {
      for (const selector of config.inputSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          if (isElementVisible(element)) {
            return {
              found: true,
              element: {
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                selector: selector,
              },
            };
          }
        }
      }
      return { found: false };
    }

    function checkSubmitButtons() {
      const buttons = [];
      for (const selector of config.submitSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          buttons.push({
            selector,
            visible: isElementVisible(element),
            disabled: (element as HTMLButtonElement).disabled || false,
          });
        }
      }
      return buttons;
    }

    // Main readiness check logic
    try {
      const pageState = {
        readyState: document.readyState,
        title: document.title,
        url: window.location.href,
        timestamp: Date.now(),
      };

      const inputCheck = findInputElement();
      const submitButtons = checkSubmitButtons();

      const isReady = document.readyState === 'complete' && inputCheck.found;
      // Note: Submit buttons are checked during injection, not readiness
      // because they may only appear after input is filled

      return {
        ready: isReady,
        reason: !isReady
          ? !inputCheck.found
            ? 'No visible input element found'
            : 'Page not fully loaded'
          : undefined,
        details: {
          pageState,
          inputElement: inputCheck,
          submitButtons,
          siteConfig: {
            name: config.name,
            id: config.id,
            inputSelectors: config.inputSelectors,
            submitSelectors: config.submitSelectors,
          },
        },
      };
    } catch (error) {
      return {
        ready: false,
        reason: `Readiness check failed: ${(error as Error).message}`,
        details: undefined,
      };
    }
  };
}
