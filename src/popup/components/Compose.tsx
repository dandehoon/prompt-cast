import React, { RefObject } from 'react';
import { SitesSection } from './SitesSection';
import { MessageSection } from './MessageSection';
import { ToastMessage } from '../../shared/types';
import { EnhancedSite } from '../../shared/stores/siteStore';

interface ComposeProps {
  sites: Record<string, EnhancedSite>;
  onFocusTab: (siteId: string) => void;
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
  sites,
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
          sites={sites}
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
