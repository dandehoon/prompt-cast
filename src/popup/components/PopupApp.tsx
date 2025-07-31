import React, { useState, useEffect, useRef } from 'react';
import { AppHeader } from './AppHeader';
import { Compose } from './Compose';
import { Settings } from './Settings';
import { useSites } from '../hooks/useSites';
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
    sites: sites,
    toggleSite,
    refreshSiteStates: refreshSiteStates,
    getEnabledSites: getEnabledSites,
    getConnectedCount,
    getEnabledCount,
  } = useSites();

  const { preferences, updateSiteEnabled } = useStorage();
  const { toasts, showToast } = useToast();
  const { currentTheme, themeOptions, changeTheme } = useTheme();

  const { sendLoading, handleSendMessage } = useMessageHandler({
    getEnabledSites,
    refreshSiteStates,
    showToast,
  });

  const {
    closeAllLoading,
    handleSiteToggle,
    handleFocusTab,
    handleCloseAllTabs,
  } = useTabOperations({
    sites,
    toggleSite,
    updateSiteEnabled,
    refreshSiteStates,
    showToast,
  });

  // Auto-focus input when popup opens
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, []);

  // Sync site enabled states with storage
  useEffect(() => {
    if (preferences?.sites) {
      Object.entries(preferences.sites).forEach(([siteId, config]) => {
        if (config && 'enabled' in config && config.enabled !== undefined) {
          toggleSite(siteId, config.enabled);
        }
      });
    }
  }, [preferences, toggleSite]);

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
            <Compose
              sites={sites}
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
            <main className="p-4 space-y-4">
              <Settings
                sites={sites}
                onSiteToggle={handleSiteToggle}
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
