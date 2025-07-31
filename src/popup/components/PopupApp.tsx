import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { Home } from './Home';
import { Settings } from './Settings';
import { useServices } from '../hooks/useServices';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../hooks/useToast';
import { useMessageHandler } from '../hooks/useMessageHandler';
import { useTabOperations } from '../hooks/useTabOperations';
import { useTheme } from '../hooks/useTheme';
import { TabId } from '../../shared/types';

export function PopupApp() {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('home');
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
  const { currentTheme, themeOptions, changeTheme } = useTheme();

  const { sendLoading, handleSendMessage } = useMessageHandler({
    getEnabledServices,
    refreshServiceStates,
    showToast,
  });

  const {
    closeAllLoading,
    handleServiceToggle,
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
          toggleService(serviceId, config.enabled);
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
    <div className="w-80 min-h-0 bg-ai-bg-primary text-ai-text-primary">
      <div className="flex flex-col">
        <AppHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />        <div className="flex-1">
          {activeTab === 'home' ? (
            <Home
              services={services}
              onFocusTab={handleFocusTab}
              onCloseAllTabs={handleCloseAllTabs}
              closeAllLoading={closeAllLoading}
              message={message}
              onMessageChange={setMessage}
              onSend={onSendMessage}
              sendLoading={sendLoading}
              messageInputRef={messageInputRef}
              toasts={toasts}
              isLoading={isLoading}
              connectedCount={connectedCount}
              enabledCount={enabledCount}
            />
          ) : (
            <main className="p-4">
              <Settings
                services={services}
                onServiceToggle={handleServiceToggle}
                currentTheme={currentTheme}
                themeOptions={themeOptions}
                onThemeChange={changeTheme}
              />
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
