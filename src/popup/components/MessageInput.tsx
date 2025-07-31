import React, { KeyboardEvent, ChangeEvent, forwardRef } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask anything',
}, ref) => {
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
        Prompt
      </label>
      <textarea
        id="messageInput"
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-20 p-3 bg-ai-bg-card border border-ai-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ai-accent text-ai-text-primary placeholder-ai-text-muted disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
});

MessageInput.displayName = 'MessageInput';
