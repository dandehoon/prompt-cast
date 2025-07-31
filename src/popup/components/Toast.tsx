import React from 'react';
import { TOAST_TYPES } from '../../shared/constants';
import { ToastMessage } from '../../shared/types';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const getToastClasses = () => {
    const baseClasses = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg text-ai-text-inverted text-sm font-medium z-50 animate-fade-in';

    switch (toast.type) {
      case TOAST_TYPES.SUCCESS:
        return `${baseClasses} bg-ai-success`;
      case TOAST_TYPES.ERROR:
        return `${baseClasses} bg-ai-error`;
      case TOAST_TYPES.INFO:
      default:
        return `${baseClasses} bg-ai-info`;
    }
  };

  return (
    <div className={getToastClasses()}>
      <div className="flex items-center justify-between">
        <span>{toast.message}</span>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-2 text-ai-text-inverted hover:text-ai-text-muted"
        >
          ×
        </button>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </>
  );
}
