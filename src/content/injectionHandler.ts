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
        const ok = await inject.call(this, inputElement, message);
        if (ok) return true;
      } catch (error) {
        logger.error('[Prompt Cast] Engine failed:', error);
      }
    }

    return false;
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

    element.focus();
    element.value = message;
    element.dispatchEvent(new Event('input', { bubbles: true }));

    await sleep(CONFIG.content.dom.injectionDelay);
    return this.sendMessage(element);
  };

  // ⚡ ExecCommand Engine - Perplexity & similar sites
  private execCommandEngine: InjectionEngine = async (element, message) => {
    const htmlElement = element as HTMLElement;

    if (htmlElement.contentEditable !== 'true') return false;

    const isExecCommandSite = this.siteConfig.injectionMethod === 'execCommand';

    if (!isExecCommandSite) return false;

    htmlElement.focus();

    // Insert the new message
    const success = document.execCommand('insertText', false, message);

    if (success) {
      await sleep(100); // Use fixed delay for execCommand sites
      return this.sendMessage(element);
    }

    return false;
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

    htmlElement.focus();
    await sleep(CONFIG.content.dom.focusDelay);

    // Clear existing content and insert new message
    htmlElement.innerHTML = `<p>${message}</p>`;
    htmlElement.dispatchEvent(new Event('input', { bubbles: true }));

    await sleep(CONFIG.content.dom.injectionDelay);
    return this.sendMessage(element);
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
