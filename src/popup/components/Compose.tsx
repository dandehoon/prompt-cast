import React, { RefObject } from 'react';
import { SitesSection } from './SitesSection';
import { MessageSection } from './MessageSection';
import { AIService, ToastMessage } from '../../shared/types';

interface ComposeProps {
  services: Record<string, AIService>;
  onFocusTab: (serviceId: string) => void;
  onCloseAllTabs: () => void;
  closeAllLoading: boolean;
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

export function Compose({
  services,
  onFocusTab,
  onCloseAllTabs,
  closeAllLoading,
  message,
  onMessageChange,
  onSend,
  sendLoading,
  messageInputRef,
  toasts,
  isLoading,
  connectedCount,
  enabledCount,
}: ComposeProps) {
  return (
    <>
      <main className="p-4 space-y-4">
        <SitesSection
          services={services}
          onFocusTab={onFocusTab}
          onCloseAllTabs={onCloseAllTabs}
          closeAllLoading={closeAllLoading}
        />
      </main>

      <MessageSection
        message={message}
        onMessageChange={onMessageChange}
        onSend={onSend}
        sendLoading={sendLoading}
        messageInputRef={messageInputRef}
        toasts={toasts}
        isLoading={isLoading}
        connectedCount={connectedCount}
        enabledCount={enabledCount}
      />
    </>
  );
}
