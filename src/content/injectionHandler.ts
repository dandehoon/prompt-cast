import type { SiteConfig } from '../types/siteConfig';
import { CONFIG } from '../shared/config';
import { sleep } from '../shared/utils';
import { logger } from '../shared/logger';

type InjectionEngine = (element: Element, message: string) => Promise<boolean>;

export class InjectionHandler {
  private injections: InjectionEngine[] = [];

  constructor(private siteConfig: SiteConfig) {
    this.init();
  }

  private init(): void {
    this.injections = [
      this.formEngine,
      this.execCommandEngine,
      this.richTextEngine,
    ];
  }

  async injectMessage(message: string): Promise<boolean> {
    const { maxInjectionAttempts, detectionDelay } = CONFIG.content.input;
    let inputElement = null;

    // Find input element
    for (let attempt = 0; attempt < maxInjectionAttempts; attempt++) {
      inputElement = this.findInputElement();
      if (inputElement) break;
      await sleep(detectionDelay);
    }

    if (!inputElement) return false;

    // Try each engine
    for (const inject of this.injections) {
      try {
        const success = await inject.call(this, inputElement, message);
        if (success) return true;
      } catch (error) {
        logger.error('[Prompt Cast] Engine failed:', error);
      }
    }

    return false;
  }

  /**
   * Common injection flow: focus → action → delay → send
   */
  private async executeInjection(
    element: Element,
    message: string,
    action: () => boolean | Promise<boolean>,
    delay = CONFIG.content.dom.injectionDelay,
  ): Promise<boolean> {
    const htmlElement = element as HTMLElement;
    htmlElement.focus();
    await sleep(CONFIG.content.dom.focusDelay);

    const actionSuccess = await action();
    if (!actionSuccess) return false;

    await sleep(delay);
    return this.sendMessage(element);
  }

  // 📝 Form Engine - textarea/input elements
  private formEngine: InjectionEngine = async (element, message) => {
    if (
      !(
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLInputElement
      )
    ) {
      return false;
    }

    return this.executeInjection(element, message, () => {
      element.value = message;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
  };

  // ⚡ ExecCommand Engine - Perplexity & similar sites
  private execCommandEngine: InjectionEngine = async (element, message) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.contentEditable !== 'true') return false;
    if (this.siteConfig.injectionMethod !== 'execCommand') return false;

    return this.executeInjection(
      element,
      message,
      () => document.execCommand('insertText', false, message),
      200, // Fixed delay for execCommand sites (matching injectionDelay)
    );
  };

  // 🎨 Rich Text Engine - Quill, ProseMirror, etc.
  private richTextEngine: InjectionEngine = async (element, message) => {
    const htmlElement = element as HTMLElement;
    if (htmlElement.contentEditable !== 'true') return false;

    const isRichEditor =
      htmlElement.classList.contains('ql-editor') ||
      htmlElement.classList.contains('ProseMirror') ||
      htmlElement.querySelector('.public-DraftEditor-content');

    if (!isRichEditor) return false;

    return this.executeInjection(element, message, () => {
      htmlElement.innerHTML = `<p>${message}</p>`;
      htmlElement.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    });
  };

  private async sendMessage(element: Element): Promise<boolean> {
    // Try send button
    for (const selector of this.siteConfig.submitSelectors) {
      const button = document.querySelector(selector) as HTMLButtonElement;
      if (button && !button.disabled && this.isVisible(button)) {
        button.click();
        return true;
      }
    }

    // Fallback to Enter key
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      }),
    );

    return true;
  }

  findInputElement(): Element | null {
    for (const selector of this.siteConfig.inputSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of Array.from(elements)) {
        if (this.isVisible(element)) {
          return element;
        }
      }
    }
    return null;
  }

  private isVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    );
  }
}
