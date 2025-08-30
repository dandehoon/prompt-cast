import { writable } from 'svelte/store';
import type { ToastMessage, ToastType } from '@/types';

// Internal toasts store
const toasts = writable<ToastMessage[]>([]);

// Toast actions
export const toastActions = {
  showToast: (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastMessage = {
      id,
      message,
      type,
      timestamp: Date.now(),
    };

    // Add toast to the store
    toasts.update((currentToasts) => [...currentToasts, toast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      toastActions.removeToast(id);
    }, duration);

    return id;
  },

  removeToast: (id: string) => {
    toasts.update((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id),
    );
  },

  clearAllToasts: () => {
    toasts.set([]);
  },

  // Convenience methods for different toast types
  showSuccess: (message: string, duration = 3000) =>
    toastActions.showToast(message, 'success', duration),

  showError: (message: string, duration = 5000) =>
    toastActions.showToast(message, 'error', duration),

  showInfo: (message: string, duration = 3000) =>
    toastActions.showToast(message, 'info', duration),
};

// Export the toasts store for reactive subscriptions
export { toasts };
