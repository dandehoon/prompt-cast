/**
 * Focus management utilities for maintaining focus on the message input
 */

/**
 * Checks if the currently active element is an input that should maintain focus
 */
export function isInputElementFocused(): boolean {
  const activeElement = document.activeElement;

  if (!activeElement) return false;

  return (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.hasAttribute('contenteditable') ||
    activeElement.closest('[role="menu"]') !== null ||
    activeElement.closest('[role="dialog"]') !== null ||
    activeElement.closest('[role="listbox"]') !== null
  );
}

/**
 * Safely focuses an element if it exists and is not already focused
 */
export function safeFocus(element: HTMLElement | undefined): boolean {
  if (!element || document.activeElement === element) {
    return false;
  }

  try {
    element.focus();
    return true;
  } catch (error) {
    console.warn('Failed to focus element:', error);
    return false;
  }
}

/**
 * Immediately focuses an element if enabled and no other input is focused
 */
export function immediateFocus(
  getElement: () => HTMLElement | undefined,
  isEnabled: () => boolean,
): boolean {
  if (!isEnabled() || isInputElementFocused()) {
    return false;
  }

  const element = getElement();
  return safeFocus(element);
}

/**
 * Creates an immediate auto-focus handler for click events
 */
export function createAutoFocusHandler(
  getElement: () => HTMLElement | undefined,
  isEnabled: () => boolean,
): {
  handler: () => void;
  attach: () => void;
  detach: () => void;
} {
  const handler = () => immediateFocus(getElement, isEnabled);

  const attach = () => {
    document.addEventListener('click', handler);
  };

  const detach = () => {
    document.removeEventListener('click', handler);
  };

  return { handler, attach, detach };
}

/**
 * Auto-selects text in an input if it has content
 */
export function autoSelectText(
  element: HTMLInputElement | HTMLTextAreaElement,
): void {
  if (element.value.trim()) {
    element.select();
  }
}
