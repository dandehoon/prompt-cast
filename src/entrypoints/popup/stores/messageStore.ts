import { writable, get } from 'svelte/store';
import { sendMessage } from '@/shared';
import { logger } from '@/shared';
import { enabledSites, siteActions } from './siteStore';
import { toastActions } from './toastStore';

export interface MessageState {
  current: string;
  history: string[];
  historyIndex: number;
  sendLoading: boolean;
  inputRef: HTMLTextAreaElement | undefined;
}

const STORAGE_KEY = 'prompt-cast-temp-message';
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
        if (savedMessage) {
          update((state) => ({ ...state, current: savedMessage }));
        }
      } catch {
        // Ignore if localStorage is not available
      }
    },

    // Set current message
    setMessage(message: string) {
      update((state) => ({ ...state, current: message }));

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
        if (state.history.length === 0) return state;

        const newIndex = Math.min(
          state.historyIndex + 1,
          state.history.length - 1,
        );
        const historyMessage = state.history[newIndex];

        if (historyMessage) {
          // Focus and position cursor at end
          setTimeout(() => {
            if (state.inputRef) {
              state.inputRef.focus();
              state.inputRef.setSelectionRange(
                historyMessage.length,
                historyMessage.length,
              );
            }
          }, 0);

          return {
            ...state,
            current: historyMessage,
            historyIndex: newIndex,
          };
        }
        return state;
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

      try {
        update((state) => ({ ...state, sendLoading: true }));
        toastActions.showToast('Preparing to send message...', 'info');

        await sendMessage('SEND_MESSAGE', {
          message: trimmedMessage,
          sites: currentEnabledSites,
        });

        // Update state: add to history, clear current message
        update((state) => {
          const newHistory = [
            trimmedMessage,
            ...state.history.slice(0, MAX_HISTORY - 1),
          ];
          return {
            ...state,
            current: '',
            history: newHistory,
            historyIndex: -1,
            sendLoading: false,
          };
        });

        // Clear from localStorage
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore
        }

        toastActions.showToast(
          `Message sent to ${currentEnabledSites.length} sites`,
          'success',
        );

        // Refresh site statuses after sending (tabs are now open/focused)
        setTimeout(() => {
          siteActions.refreshSiteStates();
        }, 1500); // Give tabs time to fully load

        // Refocus input
        setTimeout(() => {
          const state = get({ subscribe });
          if (state.inputRef) {
            state.inputRef.focus();
          }
        }, 100);
      } catch (error) {
        logger.error('Failed to send message:', error);
        toastActions.showToast('Failed to send message', 'error');
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
  };
}

export const messageStore = createMessageStore();

// Export individual reactive values for convenience
export const messageActions = {
  initialize: messageStore.initialize,
  setMessage: messageStore.setMessage,
  setInputRef: messageStore.setInputRef,
  handleArrowUp: messageStore.handleArrowUp,
  sendMessage: messageStore.sendMessage,
  clearMessage: messageStore.clearMessage,
};
