import { writable } from 'svelte/store';
import { sendMessage } from '@/shared';
import { toastActions } from './toastStore';
import { siteActions } from './siteStore';

export interface TabOperationsState {
  closeAllLoading: boolean;
}

// Create the store
function createTabOperationsStore() {
  const { subscribe, update } = writable<TabOperationsState>({
    closeAllLoading: false,
  });

  return {
    subscribe,

    // Focus a specific tab
    async focusTab(siteId: string, siteName: string) {
      try {
        await sendMessage('FOCUS_TAB', { siteId });
        toastActions.showToast(`Focused ${siteName} tab`, 'success');
      } catch {
        toastActions.showToast('Failed to focus tab', 'error');
      }
    },

    // Close all AI site tabs
    async closeAllTabs() {
      try {
        update((state) => ({ ...state, closeAllLoading: true }));
        await sendMessage('CLOSE_ALL_TABS');
        toastActions.showToast('Closed all AI site tabs', 'success');

        // Refresh site states after a short delay
        setTimeout(() => siteActions.refreshSiteStates(), 500);
      } catch {
        toastActions.showToast('Failed to close tabs', 'error');
      } finally {
        update((state) => ({ ...state, closeAllLoading: false }));
      }
    },
  };
}

export const tabOperationsStore = createTabOperationsStore();

export const tabOperationsActions = {
  focusTab: tabOperationsStore.focusTab,
  closeAllTabs: tabOperationsStore.closeAllTabs,
};
