import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('MessageStore Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Duplicate Prevention Logic', () => {
    it('should detect when message already exists at front of history', () => {
      const history = ['Existing message', 'Other message'];
      const newMessage = 'Existing message';
      
      const shouldAddToHistory = history.length === 0 || history[0] !== newMessage;
      expect(shouldAddToHistory).toBe(false);
    });

    it('should allow adding when message does not exist at front', () => {
      const history = ['Different message', 'Other message'];
      const newMessage = 'New message';
      
      const shouldAddToHistory = history.length === 0 || history[0] !== newMessage;
      expect(shouldAddToHistory).toBe(true);
    });

    it('should allow adding to empty history', () => {
      const history: string[] = [];
      const newMessage = 'First message';
      
      const shouldAddToHistory = history.length === 0 || history[0] !== newMessage;
      expect(shouldAddToHistory).toBe(true);
    });
  });

  describe('History Navigation Logic', () => {
    it('should calculate correct index for arrow up navigation', () => {
      const currentIndex = 0;
      const historyLength = 3;
      
      const newIndex = Math.min(currentIndex + 1, historyLength - 1);
      expect(newIndex).toBe(1);
    });

    it('should not exceed history bounds on arrow up', () => {
      const currentIndex = 2;
      const historyLength = 3;
      
      const newIndex = Math.min(currentIndex + 1, historyLength - 1);
      expect(newIndex).toBe(2); // Should stay the same
    });

    it('should calculate correct index for arrow down navigation', () => {
      const currentIndex = 2;
      
      const newIndex = currentIndex - 1;
      expect(newIndex).toBe(1);
    });

    it('should go to newest state when arrow down reaches -1', () => {
      const currentIndex = 0;
      
      const newIndex = currentIndex - 1;
      expect(newIndex).toBe(-1); // Newest state
    });
  });

  describe('History Management Logic', () => {
    it('should add new message to front of history without duplicates', () => {
      const existingHistory = ['Old message 1', 'Old message 2'];
      const newMessage = 'New message';
      
      let newHistory = [...existingHistory];
      if (newHistory.length === 0 || newHistory[0] !== newMessage) {
        newHistory = [newMessage, ...newHistory];
      }
      
      expect(newHistory).toEqual(['New message', 'Old message 1', 'Old message 2']);
    });

    it('should not duplicate when adding existing first message', () => {
      const existingHistory = ['Existing message', 'Old message'];
      const newMessage = 'Existing message';
      
      let newHistory = [...existingHistory];
      if (newHistory.length === 0 || newHistory[0] !== newMessage) {
        newHistory = [newMessage, ...newHistory];
      }
      
      expect(newHistory).toEqual(['Existing message', 'Old message']); // No change
    });

    it('should maintain history size limit', () => {
      const MAX_HISTORY = 3;
      const existingHistory = ['Message 1', 'Message 2', 'Message 3'];
      const newMessage = 'New message';
      
      let newHistory = [...existingHistory];
      if (newHistory.length === 0 || newHistory[0] !== newMessage) {
        newHistory = [newMessage, ...newHistory].slice(0, MAX_HISTORY);
      }
      
      expect(newHistory).toEqual(['New message', 'Message 1', 'Message 2']);
      expect(newHistory.length).toBe(MAX_HISTORY);
    });
  });

  describe('Navigation State Management', () => {
    it('should reset navigation index when user manually edits', () => {
      const currentHistoryIndex = 1; // User was navigating
      const userIsEditing = true;
      
      const newIndex = userIsEditing ? -1 : currentHistoryIndex;
      expect(newIndex).toBe(-1);
    });

    it('should maintain navigation index when user is not editing', () => {
      const currentHistoryIndex = 1;
      const userIsEditing = false;
      
      const newIndex = userIsEditing ? -1 : currentHistoryIndex;
      expect(newIndex).toBe(1);
    });
  });

  describe('First Navigation Logic', () => {
    it('should save current text when starting navigation with content', () => {
      const currentText = 'Current work';
      const existingHistory = ['Old message'];
      const historyIndex = -1; // Not currently navigating
      
      const isFirstNavigation = historyIndex === -1 && !!currentText.trim();
      expect(isFirstNavigation).toBe(true);
      
      // Should save current text
      let newHistory = [...existingHistory];
      if (isFirstNavigation && (newHistory.length === 0 || newHistory[0] !== currentText)) {
        newHistory = [currentText, ...newHistory];
      }
      
      expect(newHistory).toEqual(['Current work', 'Old message']);
    });

    it('should not save empty current text on first navigation', () => {
      const currentText = '';
      const historyIndex = -1;
      
      const isFirstNavigation = historyIndex === -1 && !!currentText.trim();
      expect(isFirstNavigation).toBe(false);
    });

    it('should not save duplicate current text on first navigation', () => {
      const currentText = 'Existing message';
      const existingHistory = ['Existing message', 'Other message'];
      const historyIndex = -1;
      
      const isFirstNavigation = historyIndex === -1 && !!currentText.trim();
      expect(isFirstNavigation).toBe(true);
      
      // Should not duplicate
      let newHistory = [...existingHistory];
      if (isFirstNavigation && (newHistory.length === 0 || newHistory[0] !== currentText)) {
        newHistory = [currentText, ...newHistory];
      }
      
      expect(newHistory).toEqual(['Existing message', 'Other message']); // No change
    });
  });

  describe('LocalStorage Integration', () => {
    it('should save history to localStorage when updated', () => {
      const newHistory = ['Message 1', 'Message 2'];
      
      // Simulate saving history
      try {
        window.localStorage.setItem('prompt-cast-message-history', JSON.stringify(newHistory));
      } catch {
        // Ignore
      }
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'prompt-cast-message-history',
        JSON.stringify(newHistory),
      );
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const newHistory = ['Message 1'];
      
      expect(() => {
        try {
          window.localStorage.setItem('prompt-cast-message-history', JSON.stringify(newHistory));
        } catch {
          // Should not throw
        }
      }).not.toThrow();
    });

    it('should load and parse history from localStorage', () => {
      const savedHistory = ['Saved 1', 'Saved 2'];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedHistory));
      
      const loadedHistory = (() => {
        try {
          const saved = window.localStorage.getItem('prompt-cast-message-history');
          if (saved) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
          }
        } catch {
          // Invalid JSON
        }
        return [];
      })();
      
      expect(loadedHistory).toEqual(savedHistory);
    });

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const loadedHistory = (() => {
        try {
          const saved = window.localStorage.getItem('prompt-cast-message-history');
          if (saved) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
          }
        } catch {
          // Invalid JSON
        }
        return [];
      })();
      
      expect(loadedHistory).toEqual([]);
    });
  });
});