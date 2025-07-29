import React, { RefObject } from 'react';
import { AIServicesSection } from './AIServicesSection';
import { MessageSection } from './MessageSection';
import { AIService, AIServiceId, ToastMessage } from '../../shared/types';

interface HomeProps {
  services: Record<AIServiceId, AIService>;
  onFocusTab: (serviceId: AIServiceId) => void;
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

export function Home({
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
}: HomeProps) {
  return (
    <>
      <main className="p-4 space-y-4">
        <AIServicesSection
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
