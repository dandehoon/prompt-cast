import { ContentMessage } from '../shared/types';
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
    
    if (this.currentServiceConfig) {
      console.log(`🔍 Detected service: ${this.currentServiceConfig.name} on ${hostname}`);
    } else {
      console.warn(`❓ Unknown AI service on ${hostname}`);
    }
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
      });
    } else {
      this.checkInputReady();
    }
  }

  private async handleMessage(
    message: ContentMessage,
    sendResponse: (response?: unknown) => void,
  ): Promise<void> {
    try {
      switch (message.type) {
        case 'INJECT_MESSAGE':
          if (message.payload?.message) {
            const success = await this.injectMessage(message.payload.message);
            sendResponse({ success, service: this.currentServiceConfig?.id });
          }
          break;

        case 'STATUS_CHECK':
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
        console.log(`✅ Input element found for ${this.currentServiceConfig?.name} after ${attempt + 1} attempts`);
        return true;
      }
      
      // Wait 1 second between attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (attempt % 3 === 0 && attempt > 0) {
        console.log(`⏳ Still waiting for input element for ${this.currentServiceConfig?.name}... (${attempt + 1}/${maxAttempts} attempts)`);
      }
    }
    
    console.warn(`❌ Input element not found for ${this.currentServiceConfig?.name} after ${maxAttempts} attempts`);
    return false;
  }

  private async injectMessage(message: string): Promise<boolean> {
    // Enhanced retry logic with up to 30 attempts and better logging
    const maxAttempts = 30;
    let inputElement = null;

    console.log(`🚀 Starting message injection for ${this.currentServiceConfig?.name}`);

    // Persistent input element detection
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      inputElement = this.findInputElement();
      if (inputElement) {
        console.log(`✅ Input element found for ${this.currentServiceConfig?.name} after ${attempt + 1} attempts`);
        break;
      }

      // Wait 500ms between attempts for faster response
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Progress logging every 5 attempts
      if (attempt % 5 === 4) {
        console.log(`⏳ Still searching for input element for ${this.currentServiceConfig?.name}... (${attempt + 1}/${maxAttempts})`);
      }
    }

    if (!inputElement) {
      console.error(`❌ Could not find input element for ${this.currentServiceConfig?.name} after ${maxAttempts} attempts`);
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
    } catch (error) {
      console.error(`AI Hub: Failed to inject message:`, error);
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
      await new Promise((resolve) => setTimeout(resolve, 100));

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
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      await new Promise((resolve) => setTimeout(resolve, 100));

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
      await new Promise((resolve) => setTimeout(resolve, 500));

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
    const maxAttempts = 10;
    let attempts = 0;

    const checkInterval = setInterval(() => {
      attempts++;
      const inputElement = this.findInputElement();

      if (inputElement || attempts >= maxAttempts) {
        clearInterval(checkInterval);

        // Notify background script about input readiness (optional)
        try {
          chrome.runtime
            .sendMessage({
              type: 'INPUT_READY',
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
    }, 1000);
  }
}

// Initialize content script
if (typeof window !== 'undefined') {
  new ContentScript();
}
