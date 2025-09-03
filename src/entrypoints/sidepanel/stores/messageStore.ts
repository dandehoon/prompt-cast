import { writable, get } from 'svelte/store';
import { sendMessage } from '@/shared';
import { logger } from '@/shared';
import { enabledSites } from './siteStore';
import { toastActions } from './toastStore';

export interface MessageState {
  current: string;
  history: string[];
  historyIndex: number;
  sendLoading: boolean;
  inputRef: HTMLTextAreaElement | undefined;
}

const STORAGE_KEY = 'prompt-cast-temp-message';
const HISTORY_STORAGE_KEY = 'prompt-cast-message-history';
const MAX_HISTORY = 10;

// Create the store
function createMessageStore() {
  const { subscribe, update } = writable<MessageState>({
    current: '',
    history: [],
    historyIndex: -1,
    sendLoading: false,
    inputRef: undefined,
  });

  return {
    subscribe,

    // Initialize message from localStorage
    initialize() {
      try {
        const savedMessage = window.localStorage.getItem(STORAGE_KEY);
        const savedHistory = window.localStorage.getItem(HISTORY_STORAGE_KEY);

        update((state) => {
          const newState = { ...state };

          if (savedMessage) {
            newState.current = savedMessage;
          }

          if (savedHistory) {
            try {
              const parsedHistory = JSON.parse(savedHistory);
              if (Array.isArray(parsedHistory)) {
                newState.history = parsedHistory.slice(0, MAX_HISTORY); // Ensure max limit
              }
            } catch {
              // Ignore invalid JSON
            }
          }

          return newState;
        });
      } catch {
        // Ignore if localStorage is not available
      }
    },

    // Set current message
    setMessage(message: string) {
      update((state) => {
        let newHistory = [...state.history];
        let newIndex = -1; // Default to fresh state

        // If user is currently navigating history and changes the text
        if (
          state.historyIndex >= 0 &&
          message.trim() &&
          message !== state.current
        ) {
          // Treat the modified text as a new item, but only if it's not already the first item
          if (newHistory.length === 0 || newHistory[0] !== message) {
            newHistory = [message, ...state.history].slice(0, MAX_HISTORY);

            // Save updated history to localStorage
            try {
              window.localStorage.setItem(
                HISTORY_STORAGE_KEY,
                JSON.stringify(newHistory),
              );
            } catch {
              // Ignore if localStorage is not available
            }
          }
          newIndex = -1; // Reset to fresh navigation state
        }

        return {
          ...state,
          current: message,
          history: newHistory,
          historyIndex: newIndex,
        };
      });

      // Auto-save to localStorage with debounce
      setTimeout(() => {
        try {
          if (message.trim()) {
            window.localStorage.setItem(STORAGE_KEY, message);
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          // Ignore if localStorage is not available
        }
      }, 200);
    },

    // Set input reference
    setInputRef(ref: HTMLTextAreaElement) {
      update((state) => ({ ...state, inputRef: ref }));
    },

    // Handle arrow up for history
    handleArrowUp() {
      update((state) => {
        if (state.history.length === 0 && !state.current.trim()) {
          // No history and no current text to save
          return state;
        }

        let newHistory = [...state.history];
        let newIndex = state.historyIndex;

        // If we're starting fresh navigation (historyIndex === -1) and have current text
        if (state.historyIndex === -1 && state.current.trim()) {
          // Only save current text if it's not already the first item in history
          if (newHistory.length === 0 || newHistory[0] !== state.current) {
            newHistory = [state.current, ...newHistory].slice(0, MAX_HISTORY);
          }
          newIndex = 0; // Start at the first item (either newly saved or existing)
        } else {
          // Navigate to next older item
          newIndex = Math.min(newIndex + 1, newHistory.length - 1);
        }

        const historyMessage = newHistory[newIndex] || '';

        // Focus and keep cursor at start for sequential navigation
        setTimeout(() => {
          if (state.inputRef) {
            state.inputRef.focus();
            state.inputRef.setSelectionRange(0, 0);
          }
        }, 0);

        return {
          ...state,
          current: historyMessage,
          history: newHistory,
          historyIndex: newIndex,
        };
      });
    },

    // Handle arrow down for history (navigate to newer items)
    handleArrowDown() {
      update((state) => {
        if (state.history.length === 0 || state.historyIndex <= 0) return state;

        const newIndex = state.historyIndex - 1;
        let newMessage = '';

        if (newIndex >= 0) {
          // Show newer history item
          newMessage = state.history[newIndex];
        }
        // If newIndex becomes -1, we show empty message (newest state)

        // Focus and keep cursor at end for sequential navigation
        setTimeout(() => {
          if (state.inputRef) {
            state.inputRef.focus();
            state.inputRef.setSelectionRange(
              newMessage.length,
              newMessage.length,
            );
          }
        }, 0);

        return {
          ...state,
          current: newMessage,
          historyIndex: newIndex,
        };
      });
    },

    // Send message
    async sendMessage() {
      const currentState = get({ subscribe });
      const trimmedMessage = currentState.current.trim();

      if (!trimmedMessage) {
        toastActions.showToast('Please enter a message', 'error');
        return;
      }

      const currentEnabledSites = get(enabledSites);
      if (currentEnabledSites.length === 0) {
        toastActions.showToast('Please enable at least one site', 'error');
        return;
      }

      // Check if already sending
      if (currentState.sendLoading) {
        toastActions.showToast(
          'Message already being sent, please wait',
          'info',
        );
        return;
      }

      // Store the message to send
      const messageToSend = trimmedMessage;

      // Set loading state to block button and immediately clear the current message
      update((state) => {
        // Only add to history if it's not already the first item
        let newHistory = [...state.history];
        if (newHistory.length === 0 || newHistory[0] !== messageToSend) {
          newHistory = [messageToSend, ...newHistory.slice(0, MAX_HISTORY - 1)];
        }

        // Save history to localStorage
        try {
          window.localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(newHistory),
          );
        } catch {
          // Ignore if localStorage is not available
        }

        return {
          ...state,
          current: '',
          history: newHistory,
          historyIndex: -1,
          sendLoading: true, // Block the button during send
        };
      });

      // Clear from localStorage immediately
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }

      // Refocus input immediately so user can start typing
      setTimeout(() => {
        const state = get({ subscribe });
        if (state.inputRef) {
          state.inputRef.focus();
        }
      }, 0);

      // Safety timeout to reset sendLoading if operation hangs (30 seconds)
      const safetyTimeout = setTimeout(() => {
        logger.warn('Send operation timed out, resetting sendLoading state');
        update((state) => ({ ...state, sendLoading: false }));
        toastActions.showToast(
          'Send operation timed out, please try again',
          'error',
        );
      }, 30000); // 30 seconds timeout

      // Send the message in the background
      toastActions.showToast('Sending message...', 'info');

      try {
        await sendMessage('SEND_MESSAGE', {
          message: messageToSend,
          sites: currentEnabledSites,
        });

        toastActions.showToast(
          `Message sent to ${currentEnabledSites.length} sites`,
          'success',
        );

        // Refresh site statuses after sending with longer delay for slow networks
        // Site statuses will auto-update via derived store when background creates tabs
        // No manual refresh needed
      } catch (error) {
        logger.error('Failed to send message:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';
        toastActions.showToast(errorMessage, 'error', 8000);
      } finally {
        // Clear the safety timeout since operation completed
        clearTimeout(safetyTimeout);
        // Always clear loading state when done
        update((state) => ({ ...state, sendLoading: false }));
      }
    },

    // Clear current message
    clearMessage() {
      update((state) => ({ ...state, current: '' }));
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    },

    // Cancel sending (reset loading state)
    cancelSendMessage() {
      update((state) => ({ ...state, sendLoading: false }));
      toastActions.showToast('Message sending cancelled', 'info');
    },
  };
}

export const messageStore = createMessageStore();

// Export individual reactive values for convenience
export const messageActions = {
  initialize: messageStore.initialize,
  setMessage: messageStore.setMessage,
  setInputRef: messageStore.setInputRef,
  handleArrowUp: messageStore.handleArrowUp,
  handleArrowDown: messageStore.handleArrowDown,
  sendMessage: messageStore.sendMessage,
  clearMessage: messageStore.clearMessage,
  cancelSendMessage: messageStore.cancelSendMessage,
};
