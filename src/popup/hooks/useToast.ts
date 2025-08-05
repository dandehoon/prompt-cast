import { useState, useCallback } from 'react';
import type { ToastMessage } from '../../types/ui';
import { CONFIG } from '../../shared/config';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: ToastMessage['type'] = 'info',
      duration?: number,
    ) => {
      const id = Date.now().toString();
      const toastDuration = duration ?? CONFIG.popup.toast.defaultDuration;
      const toast: ToastMessage = {
        id,
        message,
        type,
        duration: toastDuration,
      };

      setToasts((prev) => [...prev, toast]);

      // Auto-remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toastDuration);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
}
