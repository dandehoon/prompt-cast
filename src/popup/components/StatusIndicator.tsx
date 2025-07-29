import React from 'react';
import { TOAST_TYPES } from '../../shared/constants';
import { ToastMessage } from '../../shared/types';

interface StatusIndicatorProps {
  toasts: ToastMessage[];
  isLoading?: boolean;
  connectedCount?: number;
  enabledCount?: number;
}

export function StatusIndicator({ toasts, isLoading, connectedCount = 0, enabledCount = 0 }: StatusIndicatorProps) {
  const latestToast = toasts[toasts.length - 1];

  // Hide indicator when inactive (no loading and no toasts and no services)
  if (!isLoading && !latestToast && enabledCount === 0) {
    return null;
  }

  const getDefaultMessage = () => {
    if (isLoading) {
      return 'Loading...';
    }
    if (enabledCount === 0) {
      return 'No services enabled';
    }
    if (connectedCount === 0) {
      return `${enabledCount} services enabled`;
    }
    return `${connectedCount}/${enabledCount} services ready`;
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      );
    }

    if (!latestToast) {
      return (
        <div className="w-4 h-4 rounded-full bg-gray-500"></div>
      );
    }

    switch (latestToast.type) {
      case TOAST_TYPES.SUCCESS:
        return (
          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case TOAST_TYPES.ERROR:
        return (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case TOAST_TYPES.INFO:
      default:
        return (
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Always show status message on the left */}
      <span className="text-xs text-ai-text-secondary max-w-48 truncate">
        {latestToast ? latestToast.message : getDefaultMessage()}
      </span>

      {/* Only show icon when there are toasts */}
      {latestToast && (
        <div className="relative">
          {getStatusIcon()}

          {/* Toast count badge */}
          {toasts.length > 1 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold leading-none">{toasts.length}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
