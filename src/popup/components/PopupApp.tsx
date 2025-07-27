import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { AIServicesSection } from './AIServicesSection';
import { MessageSection } from './MessageSection';
import { useServices } from '../hooks/useServices';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../hooks/useToast';
import { useMessageHandler } from '../hooks/useMessageHandler';
import { useTabOperations } from '../hooks/useTabOperations';
import { AIServiceId } from '../../shared/types';

export function PopupApp() {
  const [message, setMessage] = useState('');
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    services,
    toggleService,
    refreshServiceStates,
    getEnabledServices,
    getConnectedCount,
    getEnabledCount,
  } = useServices();

  const { preferences, updateServiceEnabled } = useStorage();
  const { toasts, showToast } = useToast();

  const { sendLoading, handleSendMessage } = useMessageHandler({
    getEnabledServices,
    refreshServiceStates,
    showToast,
  });

  const {
    closeAllLoading,
    handleServiceToggle,
    handleCloseTab,
    handleFocusTab,
    handleCloseAllTabs,
  } = useTabOperations({
    services,
    toggleService,
    updateServiceEnabled,
    refreshServiceStates,
    showToast,
  });

  // Auto-focus input when popup opens
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []);

  // Sync service enabled states with storage
  useEffect(() => {
    if (preferences?.services) {
      Object.entries(preferences.services).forEach(([serviceId, config]) => {
        if (config && 'enabled' in config && config.enabled !== undefined) {
          toggleService(serviceId as AIServiceId, config.enabled);
        }
      });
    }
  }, [preferences, toggleService]);

  const onSendMessage = async () => {
    const success = await handleSendMessage(message);
    if (success) {
      setMessage('');
    }
  };

  const connectedCount = getConnectedCount();
  const enabledCount = getEnabledCount();
  const isLoading = sendLoading || closeAllLoading;

  return (
    <div className="w-80 min-h-0 bg-ai-dark text-ai-text">
      <div className="flex flex-col">
        <AppHeader toasts={toasts} isLoading={isLoading} />

        <main className="p-4 space-y-4">
          <AIServicesSection
            services={services}
            onServiceToggle={handleServiceToggle}
            onCloseTab={handleCloseTab}
            onFocusTab={handleFocusTab}
            onCloseAllTabs={handleCloseAllTabs}
            closeAllLoading={closeAllLoading}
          />
        </main>

        <MessageSection
          message={message}
          onMessageChange={setMessage}
          onSend={onSendMessage}
          sendLoading={sendLoading}
          messageInputRef={messageInputRef}
          connectedCount={connectedCount}
          enabledCount={enabledCount}
        />
      </div>
    </div>
  );
}
