import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isInputElementFocused,
  safeFocus,
  immediateFocus,
  createAutoFocusHandler,
  autoSelectText,
} from '@/shared/focusUtils';

// Mock DOM APIs
const mockElement = () => ({
  focus: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  value: '',
  select: vi.fn(),
  tagName: 'TEXTAREA',
  hasAttribute: vi.fn(() => false),
  closest: vi.fn(() => null),
});

// Mock document.activeElement
const mockActiveElement = {
  activeElement: null as any,
};

Object.defineProperty(document, 'activeElement', {
  get: () => mockActiveElement.activeElement,
  configurable: true,
});

describe('focusUtils', () => {
  beforeEach(() => {
    // Reset DOM
    mockActiveElement.activeElement = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('isInputElementFocused', () => {
    it('should return false when no element is focused', () => {
      mockActiveElement.activeElement = null;
      expect(isInputElementFocused()).toBe(false);
    });

    it('should return true for INPUT elements', () => {
      const input = { tagName: 'INPUT' } as any;
      mockActiveElement.activeElement = input;
      expect(isInputElementFocused()).toBe(true);
    });

    it('should return true for TEXTAREA elements', () => {
      const textarea = { tagName: 'TEXTAREA' } as any;
      mockActiveElement.activeElement = textarea;
      expect(isInputElementFocused()).toBe(true);
    });

    it('should return true for contenteditable elements', () => {
      const div = {
        tagName: 'DIV',
        hasAttribute: vi.fn((attr) => attr === 'contenteditable'),
        closest: vi.fn(() => null),
      } as any;
      mockActiveElement.activeElement = div;
      expect(isInputElementFocused()).toBe(true);
    });

    it('should return true for elements in menus/dialogs', () => {
      const element = {
        tagName: 'BUTTON',
        hasAttribute: vi.fn(() => false),
        closest: vi.fn((selector) =>
          selector === '[role="menu"]' ? {} : null,
        ),
      } as any;
      mockActiveElement.activeElement = element;
      expect(isInputElementFocused()).toBe(true);
    });

    it('should return false for other elements', () => {
      const button = {
        tagName: 'BUTTON',
        hasAttribute: vi.fn(() => false),
        closest: vi.fn(() => null),
      } as any;
      mockActiveElement.activeElement = button;
      expect(isInputElementFocused()).toBe(false);
    });
  });

  describe('safeFocus', () => {
    it('should return false for undefined element', () => {
      expect(safeFocus(undefined)).toBe(false);
    });

    it('should return false if element is already focused', () => {
      const element = mockElement() as any;
      mockActiveElement.activeElement = element;
      expect(safeFocus(element)).toBe(false);
      expect(element.focus).not.toHaveBeenCalled();
    });

    it('should focus element and return true', () => {
      const element = mockElement() as any;
      mockActiveElement.activeElement = null;
      expect(safeFocus(element)).toBe(true);
      expect(element.focus).toHaveBeenCalled();
    });

    it('should handle focus errors gracefully', () => {
      const element = mockElement() as any;
      element.focus.mockImplementation(() => {
        throw new Error('Focus failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(safeFocus(element)).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to focus element:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('immediateFocus', () => {
    it('should immediately focus element when enabled and no input focused', () => {
      const element = mockElement() as any;
      const getElement = vi.fn(() => element);
      const isEnabled = vi.fn(() => true);

      mockActiveElement.activeElement = null;

      const result = immediateFocus(getElement, isEnabled);

      expect(result).toBe(true);
      expect(element.focus).toHaveBeenCalled();
      expect(getElement).toHaveBeenCalled();
      expect(isEnabled).toHaveBeenCalled();
    });

    it('should not focus when disabled', () => {
      const element = mockElement() as any;
      const getElement = vi.fn(() => element);
      const isEnabled = vi.fn(() => false);

      const result = immediateFocus(getElement, isEnabled);

      expect(result).toBe(false);
      expect(element.focus).not.toHaveBeenCalled();
    });

    it('should not focus when input element is already focused', () => {
      const element = mockElement() as any;
      const getElement = vi.fn(() => element);
      const isEnabled = vi.fn(() => true);

      mockActiveElement.activeElement = { tagName: 'INPUT' };

      const result = immediateFocus(getElement, isEnabled);

      expect(result).toBe(false);
      expect(element.focus).not.toHaveBeenCalled();
    });

    it('should not focus when element is not available', () => {
      const getElement = vi.fn(() => undefined);
      const isEnabled = vi.fn(() => true);

      const result = immediateFocus(getElement, isEnabled);

      expect(result).toBe(false);
    });
  });

  describe('createAutoFocusHandler', () => {
    it('should create and attach/detach auto-focus handler', () => {
      const element = mockElement() as any;
      const getElement = vi.fn(() => element);
      const isEnabled = vi.fn(() => true);

      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { attach, detach } = createAutoFocusHandler(getElement, isEnabled);

      attach();
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );

      detach();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
      );

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });

    it('should focus element on click when enabled', () => {
      const element = mockElement() as any;
      const getElement = vi.fn(() => element);
      const isEnabled = vi.fn(() => true);

      mockActiveElement.activeElement = null;

      const { handler } = createAutoFocusHandler(getElement, isEnabled);

      handler();

      expect(element.focus).toHaveBeenCalled();
    });

    it('should not focus on click when disabled', () => {
      const element = mockElement() as any;
      const getElement = vi.fn(() => element);
      const isEnabled = vi.fn(() => false);

      const { handler } = createAutoFocusHandler(getElement, isEnabled);

      handler();

      expect(element.focus).not.toHaveBeenCalled();
    });
  });

  describe('autoSelectText', () => {
    it('should select text if element has content', () => {
      const element = mockElement() as any;
      element.value = 'test content';

      autoSelectText(element);
      expect(element.select).toHaveBeenCalled();
    });

    it('should not select text if element is empty', () => {
      const element = mockElement() as any;
      element.value = '';

      autoSelectText(element);
      expect(element.select).not.toHaveBeenCalled();
    });

    it('should not select text if element has only whitespace', () => {
      const element = mockElement() as any;
      element.value = '   ';

      autoSelectText(element);
      expect(element.select).not.toHaveBeenCalled();
    });
  });
});
