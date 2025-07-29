import React, { RefObject } from 'react';
import { MessageInput } from './MessageInput';
import { StatusIndicator } from './StatusIndicator';
import { ToastMessage } from '../../shared/types';

interface MessageSectionProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  sendLoading: boolean;
  messageInputRef: RefObject<HTMLTextAreaElement>;
  toasts: ToastMessage[];
  isLoading: boolean;
  connectedCount: number;
  enabledCount: number;
}

export function MessageSection({
  message,
  onMessageChange,
  onSend,
  sendLoading,
  messageInputRef,
  toasts,
  isLoading,
  connectedCount,
  enabledCount,
}: MessageSectionProps) {
  const hasMessage = message.trim().length > 0;

  return (
    <footer className="p-4 border-t border-ai-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <MessageInput
            ref={messageInputRef}
            value={message}
            onChange={onMessageChange}
            onSend={onSend}
            disabled={sendLoading}
          />
        </div>
      </div>

      <button
        onClick={onSend}
        disabled={!hasMessage || sendLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {sendLoading ? 'Sending...' : 'Send'}
      </button>

      <div className="flex items-center justify-end">
        <StatusIndicator
          toasts={toasts}
          isLoading={isLoading}
          connectedCount={connectedCount}
          enabledCount={enabledCount}
        />
      </div>
    </footer>
  );
}
