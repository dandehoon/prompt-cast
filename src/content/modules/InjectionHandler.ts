import type { SiteConfig } from '../../types/site';
import { CONFIG } from '../../shared/config';
import { sleep } from '../../shared/utils';

export class InjectionHandler {
  constructor(private siteConfig: SiteConfig) {}

  async injectMessage(message: string): Promise<boolean> {
    const { maxInjectionAttempts, detectionDelay } = CONFIG.content.input;
    let inputElement = null;

    // Persistent input element detection with faster intervals
    for (let attempt = 0; attempt < maxInjectionAttempts; attempt++) {
      inputElement = this.findInputElement();
      if (inputElement) {
        break;
      }

      // Wait between attempts for faster response
      await sleep(detectionDelay);
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
    } catch {
      return false;
    }
  }

  private async injectIntoTextarea(
    element: HTMLTextAreaElement | HTMLInputElement,
    message: string,
  ): Promise<boolean> {
    try {
      const { focusDelay, injectionDelay } = CONFIG.content.dom;

      // Focus the element first
      element.focus();
      await sleep(focusDelay);

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
      await sleep(injectionDelay);

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
    } catch {
      return false;
    }
  }

  private async injectIntoContentEditable(
    element: HTMLElement,
    message: string,
  ): Promise<boolean> {
    try {
      const { focusDelay, injectionDelay } = CONFIG.content.dom;

      // Focus the element first
      element.focus();
      await sleep(focusDelay);

      // Clear existing content and set new content
      element.innerHTML = '';

      if (this.siteConfig.id === 'claude') {
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
        // Default handling for other sites
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
      await sleep(injectionDelay);

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
    } catch {
      return false;
    }
  }

  private async clickSendButton(): Promise<boolean> {
    const selectors = this.siteConfig.submitSelectors;

    for (const selector of selectors) {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button && !button.disabled && this.isElementVisible(button)) {
        try {
          button.click();
          return true;
        } catch {
          // Continue to next selector
        }
      }
    }

    return false;
  }

  findInputElement(): Element | null {
    const selectors = this.siteConfig.inputSelectors;

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);

      for (const element of Array.from(elements)) {
        if (this.isElementVisible(element)) {
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
}
