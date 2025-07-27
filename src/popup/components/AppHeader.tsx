import React from 'react';
import { StatusIndicator } from './StatusIndicator';
import { ToastMessage } from '../../shared/types';

interface AppHeaderProps {
  toasts: ToastMessage[];
  isLoading: boolean;
}

export function AppHeader({ toasts, isLoading }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-3 border-b border-ai-border">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
        <h1 className="text-base font-semibold">Prompt Cast</h1>
      </div>
      <StatusIndicator toasts={toasts} isLoading={isLoading} />
    </header>
  );
}
