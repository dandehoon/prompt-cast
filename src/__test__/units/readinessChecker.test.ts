import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReadinessChecker } from '../../content/readinessChecker';
import type { SiteConfig } from '../../types/siteConfig';

// Mock dependencies
vi.mock('../../shared/config', () => ({
  CONFIG: {
    content: {
      input: {
        maxReadinessAttempts: 3,
        detectionDelay: 100,
      },
      polling: {
        maxPollingAttempts: 5,
        pollingInterval: 200,
      },
      observer: {
        timeout: 10000,
      },
    },
  },
}));

vi.mock('../../shared/utils', () => ({
  sleep: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../shared/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ReadinessChecker', () => {
  let readinessChecker: ReadinessChecker;
  let mockFindInputElement: ReturnType<typeof vi.fn>;
  let mockSiteConfig: SiteConfig;

  beforeEach(() => {
    mockFindInputElement = vi.fn();
    mockSiteConfig = {
      id: 'test-site',
      name: 'Test Site',
      url: 'https://test.com',
      enabled: true,
      inputSelectors: ['.input', '#message'],
      submitSelectors: ['.send', '#submit'],
      injectionMethod: 'execCommand',
    } as SiteConfig;

    readinessChecker = new ReadinessChecker(
      mockSiteConfig,
      mockFindInputElement,
    );

    // Mock DOM methods
    Object.defineProperty(global, 'document', {
      value: {
        readyState: 'complete',
        addEventListener: vi.fn(),
        querySelector: vi.fn(),
        querySelectorAll: vi.fn(),
        body: {
          querySelector: vi.fn(),
        },
      },
      writable: true,
    });

    Object.defineProperty(global, 'window', {
      value: {
        MutationObserver: vi.fn().mockImplementation(() => ({
          observe: vi.fn(),
          disconnect: vi.fn(),
        })),
        Node: {
          ELEMENT_NODE: 1,
        },
        setInterval: vi.fn(),
        clearInterval: vi.fn(),
        setTimeout: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('checkInputWithRetries', () => {
    it('should return true when input element is found on first attempt', async () => {
      const mockElement = { tagName: 'INPUT' };
      mockFindInputElement.mockReturnValue(mockElement);

      const result = await readinessChecker.checkInputWithRetries();

      expect(result).toBe(true);
      expect(mockFindInputElement).toHaveBeenCalledTimes(1);
    });

    it('should return true when input element is found after retries', async () => {
      const mockElement = { tagName: 'INPUT' };
      mockFindInputElement
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValue(mockElement);

      const result = await readinessChecker.checkInputWithRetries();

      expect(result).toBe(true);
      expect(mockFindInputElement).toHaveBeenCalledTimes(3);
    });

    it('should return false when input element is never found', async () => {
      mockFindInputElement.mockReturnValue(null);

      const result = await readinessChecker.checkInputWithRetries();

      expect(result).toBe(false);
      expect(mockFindInputElement).toHaveBeenCalledTimes(3);
    });

    it('should respect custom maxAttempts parameter', async () => {
      mockFindInputElement.mockReturnValue(null);

      const result = await readinessChecker.checkInputWithRetries(5);

      expect(result).toBe(false);
      expect(mockFindInputElement).toHaveBeenCalledTimes(5);
    });

    it('should use sleep delay between attempts', async () => {
      const { sleep } = await import('../../shared/utils');
      mockFindInputElement.mockReturnValue(null);

      await readinessChecker.checkInputWithRetries(2);

      expect(sleep).toHaveBeenCalledWith(100);
      expect(sleep).toHaveBeenCalledTimes(2);
    });
  });

  describe('initializeReadinessCheck', () => {
    it('should set up DOMContentLoaded listener when document is loading', () => {
      const mockAddEventListener = vi.fn();
      Object.defineProperty(document, 'readyState', { value: 'loading' });
      Object.defineProperty(document, 'addEventListener', {
        value: mockAddEventListener,
      });

      readinessChecker.initializeReadinessCheck();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function),
      );
    });

    it('should immediately check readiness when document is already loaded', () => {
      Object.defineProperty(document, 'readyState', { value: 'complete' });
      const spy = vi.spyOn(readinessChecker as any, 'checkInputReady');
      const setupSpy = vi.spyOn(readinessChecker as any, 'setupDOMObserver');

      readinessChecker.initializeReadinessCheck();

      expect(spy).toHaveBeenCalled();
      expect(setupSpy).toHaveBeenCalled();
    });
  });

  describe('setupDOMObserver', () => {
    it('should not set up observer when MutationObserver is undefined', () => {
      Object.defineProperty(window, 'MutationObserver', { value: undefined });

      const setupMethod = (readinessChecker as any).setupDOMObserver;
      expect(() => setupMethod()).not.toThrow();
    });

    it('should create MutationObserver when available', () => {
      const mockObserverInstance = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
      const MockMutationObserver = vi.fn(() => mockObserverInstance);
      Object.defineProperty(window, 'MutationObserver', {
        value: MockMutationObserver,
      });

      (readinessChecker as any).setupDOMObserver();

      expect(MockMutationObserver).toHaveBeenCalledWith(expect.any(Function));
      expect(mockObserverInstance.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
      });
    });

    it('should handle mutation callback with added nodes', () => {
      const mockElement = {
        matches: vi.fn(() => true),
        querySelector: vi.fn(),
        nodeType: 1,
      };

      const mockMutation = {
        type: 'childList',
        addedNodes: [mockElement],
      };

      let mutationCallback: ((mutations: any[]) => void) | undefined;
      const mockObserverInstance = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      const MockMutationObserver = vi.fn((callback) => {
        mutationCallback = callback;
        return mockObserverInstance;
      });

      Object.defineProperty(window, 'MutationObserver', {
        value: MockMutationObserver,
      });

      (readinessChecker as any).setupDOMObserver();

      // Trigger the mutation callback
      if (mutationCallback) {
        mutationCallback([mockMutation]);
      }

      expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complex DOM mutation scenarios', () => {
      const mockElement = {
        matches: vi.fn(() => false),
        querySelector: vi.fn(() => ({ tagName: 'INPUT' })),
        nodeType: 1,
      };

      const mockMutation = {
        type: 'childList',
        addedNodes: [mockElement],
      };

      let mutationCallback: ((mutations: any[]) => void) | undefined;
      const mockObserver2 = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      const MockMutationObserver2 = vi.fn((callback) => {
        mutationCallback = callback;
        return mockObserver2;
      });

      Object.defineProperty(window, 'MutationObserver', {
        value: MockMutationObserver2,
      });

      (readinessChecker as any).setupDOMObserver();

      // Simulate finding input in child elements
      if (mutationCallback) {
        mutationCallback([mockMutation]);
      }

      expect(mockElement.querySelector).toHaveBeenCalled();
      expect(mockObserver2.disconnect).toHaveBeenCalled();
    });

    it('should ignore non-element nodes in mutations', () => {
      const mockTextNode = {
        nodeType: 3, // TEXT_NODE
      };

      const mockMutation = {
        type: 'childList',
        addedNodes: [mockTextNode],
      };

      let mutationCallback: ((mutations: any[]) => void) | undefined;
      const mockObserver3 = {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };

      const MockMutationObserver3 = vi.fn((callback) => {
        mutationCallback = callback;
        return mockObserver3;
      });

      Object.defineProperty(window, 'MutationObserver', {
        value: MockMutationObserver3,
      });

      (readinessChecker as any).setupDOMObserver();

      if (mutationCallback) {
        mutationCallback([mockMutation]);
      }

      // Should not disconnect since no element nodes were processed
      expect(mockObserver3.disconnect).not.toHaveBeenCalled();
    });
  });
});
