import { renderHook, act } from '@testing-library/react';
import { usePromptHistory } from '../usePromptHistory';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('usePromptHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should load history from localStorage on mount', () => {
      const mockHistory = ['prompt1', 'prompt2'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockHistory));

      const { result } = renderHook(() => usePromptHistory());

      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'prompt-cast-history',
      );
      expect(result.current.getLastPrompt()).toBe('prompt1');
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const { result } = renderHook(() => usePromptHistory());

      expect(result.current.getLastPrompt()).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => usePromptHistory());

      expect(result.current.getLastPrompt()).toBeNull();
    });
  });

  describe('addToHistory', () => {
    it('should add a new prompt to history', () => {
      const { result } = renderHook(() => usePromptHistory());

      act(() => {
        result.current.addToHistory('new prompt');
      });

      expect(result.current.getLastPrompt()).toBe('new prompt');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-cast-history',
        JSON.stringify(['new prompt']),
      );
    });

    it('should trim whitespace from prompts', () => {
      const { result } = renderHook(() => usePromptHistory());

      act(() => {
        result.current.addToHistory('  trimmed prompt  ');
      });

      expect(result.current.getLastPrompt()).toBe('trimmed prompt');
    });

    it('should ignore empty or whitespace-only prompts', () => {
      const { result } = renderHook(() => usePromptHistory());

      act(() => {
        result.current.addToHistory('');
      });

      act(() => {
        result.current.addToHistory('   ');
      });

      expect(result.current.getLastPrompt()).toBeNull();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should remove duplicates and move recent prompt to front', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['prompt1', 'prompt2', 'prompt3']),
      );

      const { result } = renderHook(() => usePromptHistory());

      act(() => {
        result.current.addToHistory('prompt2');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-cast-history',
        JSON.stringify(['prompt2', 'prompt1', 'prompt3']),
      );
    });

    it('should limit history to maximum size', () => {
      // Create a history with 10 items (the max)
      const maxHistory = Array.from({ length: 10 }, (_, i) => `prompt${i + 1}`);
      localStorageMock.getItem.mockReturnValue(JSON.stringify(maxHistory));

      const { result } = renderHook(() => usePromptHistory());

      act(() => {
        result.current.addToHistory('new prompt');
      });

      // Should remove the last item and add new one at the front
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-cast-history',
        JSON.stringify(['new prompt', ...maxHistory.slice(0, 9)]),
      );
    });

    it('should handle localStorage errors when saving', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const { result } = renderHook(() => usePromptHistory());

      // Should not throw error
      act(() => {
        result.current.addToHistory('test prompt');
      });

      expect(result.current.getLastPrompt()).toBe('test prompt');
    });
  });

  describe('getLastPrompt', () => {
    it('should return the most recent prompt', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify(['recent', 'older', 'oldest']),
      );

      const { result } = renderHook(() => usePromptHistory());

      expect(result.current.getLastPrompt()).toBe('recent');
    });

    it('should return null when history is empty', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify([]));

      const { result } = renderHook(() => usePromptHistory());

      expect(result.current.getLastPrompt()).toBeNull();
    });

    it('should return null when no history exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => usePromptHistory());

      expect(result.current.getLastPrompt()).toBeNull();
    });
  });
});
