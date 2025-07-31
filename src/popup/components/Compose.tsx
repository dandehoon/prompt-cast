import React, { RefObject } from 'react';
import { SitesSection } from './SitesSection';
import { MessageSection } from './MessageSection';
import { AISite, ToastMessage, SiteStatusType } from '../../shared/types';

// Extended site interface for popup components (includes computed status)
interface PopupSite extends AISite {
  status: SiteStatusType;
}

interface ComposeProps {
  sites: Record<string, PopupSite>;
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
