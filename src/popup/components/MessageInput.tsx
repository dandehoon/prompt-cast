import React, { KeyboardEvent, ChangeEvent } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Type message for all AI services...',
}: MessageInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends message, Shift+Enter creates new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="messageInput" className="block text-sm font-medium">
        Message for AI Services
      </label>
      <textarea
        id="messageInput"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-20 p-3 bg-ai-card border border-ai-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-ai-text placeholder-ai-text-secondary disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="text-xs text-ai-text-secondary">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}
