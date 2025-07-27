import React, { RefObject } from 'react';
import { MessageInput } from './MessageInput';
import { StatusBar } from './StatusBar';

interface MessageSectionProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  sendLoading: boolean;
  messageInputRef: RefObject<HTMLTextAreaElement>;
  connectedCount: number;
  enabledCount: number;
}

export function MessageSection({
  message,
  onMessageChange,
  onSend,
  sendLoading,
  messageInputRef,
  connectedCount,
  enabledCount,
}: MessageSectionProps) {
  const hasMessage = message.trim().length > 0;

  return (
    <footer className="p-4 border-t border-ai-border space-y-3">
      {/* Message Input */}
      <MessageInput
        ref={messageInputRef}
        value={message}
        onChange={onMessageChange}
        onSend={onSend}
        disabled={sendLoading}
      />

      {/* Send Button */}
      <button
        onClick={onSend}
        disabled={!hasMessage || sendLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {sendLoading ? 'Sending...' : 'Send'}
      </button>

      {/* Status Bar */}
      <StatusBar connectedCount={connectedCount} enabledCount={enabledCount} />
    </footer>
  );
}
