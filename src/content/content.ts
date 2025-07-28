import { ContentMessage } from '../shared/types';
import { CONTENT_MESSAGE_TYPES } from '../shared/constants';
import { getServiceByHostname, ServiceConfig } from '../shared/serviceConfig';

class ContentScript {
  private currentServiceConfig: ServiceConfig | null = null;

  constructor() {
    this.detectService();
    this.initializeListeners();
  }

  private detectService(): void {
    const hostname = window.location.hostname;
    this.currentServiceConfig = getServiceByHostname(hostname);
  }

  private initializeListeners(): void {
    if (!this.currentServiceConfig) return;

    chrome.runtime.onMessage.addListener(
      (
        message: ContentMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
      ) => {
        this.handleMessage(message, sendResponse);
        return true; // Keep message channel open
      },
    );

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

  private async handleMessage(
    message: ContentMessage,
    sendResponse: (response?: unknown) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case CONTENT_MESSAGE_TYPES.INJECT_MESSAGE:
          if (message.payload?.message) {
            const success = await this.injectMessage(message.payload.message);
            sendResponse({ success, service: this.currentServiceConfig?.id });
          }
          break;

        case CONTENT_MESSAGE_TYPES.STATUS_CHECK:
          // Use enhanced input detection with retries
          const isInputReady = await this.checkInputWithRetries();
          sendResponse({
            ready: isInputReady,
            service: this.currentServiceConfig?.id,
            url: window.location.href,
          });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error(`AI Hub Content Script error:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      sendResponse({ success: false, error: errorMessage });
    }
  }

  private async checkInputWithRetries(maxAttempts = 10): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const inputElement = this.findInputElement();
      if (inputElement) {
        return true;
      }

      // Wait 100ms between attempts for faster response
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }

  private async injectMessage(message: string): Promise<boolean> {
    const maxAttempts = 15; // Increased attempts but faster intervals
    let inputElement = null;

    // Persistent input element detection with faster intervals
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      inputElement = this.findInputElement();
      if (inputElement) {
        break;
      }

      // Wait 100ms between attempts for faster response
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!inputElement) {
      return false;
    }

    try {
      // Different injection methods based on element type
      if (
        inputElement instanceof HTMLTextAreaElement ||
        inputElement instanceof HTMLInputElement
      ) {
        return await this.injectIntoTextarea(inputElement, message);
      } else if ((inputElement as HTMLElement).contentEditable === 'true') {
        return await this.injectIntoContentEditable(
          inputElement as HTMLElement,
          message,
        );
      } else {
        return false;
      }
    } catch (_error) {
      return false;
    }
  }

  private async injectIntoTextarea(
    element: HTMLTextAreaElement | HTMLInputElement,
    message: string,
  ): Promise<boolean> {
    try {
      // Focus the element first
      element.focus();
      await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced from 100ms

      // Set the value using multiple approaches
      const nativeValueSetter =
        Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value',
        )?.set ||
        Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )?.set;

      if (nativeValueSetter) {
        nativeValueSetter.call(element, message);
      } else {
        element.value = message;
      }

      // Trigger comprehensive events
      const events = [
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new Event('keyup', { bubbles: true }),
        new Event('focus', { bubbles: true }),
      ];

      events.forEach((event) => element.dispatchEvent(event));

      // Wait a bit and then try to find and click send button
      await new Promise((resolve) => setTimeout(resolve, 200)); // Reduced from 500ms

      // Try to find and click the send button
      const sendButtonClicked = await this.clickSendButton();

      if (!sendButtonClicked) {
        // Fallback to Enter key
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(enterEvent);
      }

      return true;
    } catch (_error) {
      return false;
    }
  }

  private async injectIntoContentEditable(
    element: HTMLElement,
    message: string,
  ): Promise<boolean> {
    try {
      // Focus the element first
      element.focus();
      await new Promise((resolve) => setTimeout(resolve, 50)); // Reduced from 100ms

      // Clear existing content and set new content
      element.innerHTML = '';

      if (this.currentServiceConfig?.id === 'claude') {
        // Claude-specific handling
        const textNode = document.createTextNode(message);
        element.appendChild(textNode);

        // Set cursor at end using Selection API
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } else {
        // Default handling for other services
        element.textContent = message;

        // For rich text editors, also try innerHTML
        if (
          element.classList.contains('ql-editor') ||
          element.classList.contains('ProseMirror')
        ) {
          element.innerHTML = `<p>${message}</p>`;
        }
      }

      // Trigger comprehensive events
      const events = [
        new Event('input', { bubbles: true }),
        new Event('change', { bubbles: true }),
        new Event('keyup', { bubbles: true }),
        new Event('focus', { bubbles: true }),
        new Event('beforeinput', { bubbles: true }),
      ];

      // For rich text editors, add composition events
      if (
        element.classList.contains('ProseMirror') ||
        element.classList.contains('ql-editor')
      ) {
        events.push(
          new CompositionEvent('compositionstart', { bubbles: true }),
          new CompositionEvent('compositionend', { bubbles: true }),
        );
      }

      events.forEach((event) => element.dispatchEvent(event));

      // Wait and try to send
      await new Promise((resolve) => setTimeout(resolve, 200)); // Reduced from 500ms

      // Try to find and click send button
      const sendButtonClicked = await this.clickSendButton();

      if (!sendButtonClicked) {
        // Fallback to Enter key
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        });
        element.dispatchEvent(enterEvent);
      }

      return true;
    } catch (_error) {
      return false;
    }
  }

  private async clickSendButton(): Promise<boolean> {
    if (!this.currentServiceConfig) return false;

    const selectors = this.currentServiceConfig.submitSelectors;

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button && !button.disabled && this.isElementVisible(button)) {
        try {
          button.click();
          return true;
        } catch (_error) {
          // Continue to next selector
        }
      }
    }

    return false;
  }

  private findInputElement(): Element | null {
    if (!this.currentServiceConfig) return null;

    const selectors = this.currentServiceConfig.inputSelectors;

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of Array.from(elements)) {
        if (this.isElementVisible(element)) {
          return element;
        }
      }
    }

    // If no element found with standard selectors, try broader search
    const fallbackSelectors = [
      'textarea:not([readonly]):not([disabled])',
      '[contenteditable="true"]',
      'input[type="text"]:not([readonly]):not([disabled])',
    ];

    for (const selector of fallbackSelectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of Array.from(elements)) {
        if (
          this.isElementVisible(element) &&
          this.isLikelyInputField(element)
        ) {
          return element;
        }
      }
    }

    return null;
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }

  private isLikelyInputField(element: Element): boolean {
    const text = element.textContent || '';
    const placeholder = element.getAttribute('placeholder') || '';
    const ariaLabel = element.getAttribute('aria-label') || '';

    const inputKeywords = [
      'message',
      'chat',
      'ask',
      'prompt',
      'question',
      'input',
      'type',
      'enter',
      'talk',
    ];

    const combinedText = (
      text +
      ' ' +
      placeholder +
      ' ' +
      ariaLabel
    ).toLowerCase();

    return inputKeywords.some((keyword) => combinedText.includes(keyword));
  }

  private checkInputReady(): void {
    const maxAttempts = 20; // Increased attempts
    let attempts = 0;
    const checkInterval = 500; // Faster checking (500ms instead of 1s)

    const check = setInterval(() => {
      attempts++;
      const inputElement = this.findInputElement();

      if (inputElement || attempts >= maxAttempts) {
        clearInterval(check);

        // Notify background script about input readiness (optional)
        try {
          chrome.runtime
            .sendMessage({
              type: CONTENT_MESSAGE_TYPES.INPUT_READY,
              payload: {
                ready: !!inputElement,
                service: this.currentServiceConfig?.id,
                attempts,
              },
            })
            .catch(() => {}); // Ignore errors
        } catch (_error) {
          // Ignore messaging errors
        }
      }
    }, checkInterval);
  }

  private setupDOMObserver(): void {
    // Set up a MutationObserver to detect when input elements are added dynamically
    // This is especially useful for ChatGPT which loads content dynamically
    if (
      !this.currentServiceConfig ||
      typeof window.MutationObserver === 'undefined'
    )
      return;

    const observer = new window.MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any of the added nodes or their children contain input elements
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === window.Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if this element or its children match our input selectors
              const hasInputElement =
                this.currentServiceConfig!.inputSelectors.some((selector) => {
                  return (
                    element.matches &&
                    (element.matches(selector) ||
                      element.querySelector(selector))
                  );
                });

              if (hasInputElement) {
                // Found input element, stop observing and notify
                observer.disconnect();
                try {
                  chrome.runtime
                    .sendMessage({
                      type: CONTENT_MESSAGE_TYPES.INPUT_READY,
                      payload: {
                        ready: true,
                        service: this.currentServiceConfig?.id,
                        dynamicallyDetected: true,
                      },
                    })
                    .catch(() => {}); // Ignore errors
                } catch (_error) {
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

    // Stop observing after 15 seconds to prevent memory leaks
    setTimeout(() => {
      observer.disconnect();
    }, 15000);
  }
}

// Initialize content script
if (typeof window !== 'undefined') {
  new ContentScript();
}
