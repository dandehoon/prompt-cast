import React from 'react';
import { ToastMessage } from '../../shared/types';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

export function Toast({ toast, onRemove }: ToastProps) {
  const getToastClasses = () => {
    const baseClasses = 'fixed bottom-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-medium z-50 animate-fade-in';

    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-green-600`;
      case 'error':
        return `${baseClasses} bg-red-600`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-600`;
    }
  };

  return (
    <div className={getToastClasses()}>
      <div className="flex items-center justify-between">
        <span>{toast.message}</span>
        <button
          onClick={() => onRemove(toast.id)}
          className="ml-2 text-white hover:text-gray-200"
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
