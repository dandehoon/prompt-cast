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
import { usePromptHistory } from '../hooks/usePromptHistory';
import { TabId } from '../../types';

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
  const { addToHistory, getLastPrompt } = usePromptHistory();

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

  // Load saved message from local storage (persistent across popup reopens) when popup opens
  useEffect(() => {
    try {
      const savedMessage = window.localStorage.getItem('prompt-cast-temp-message');
      if (savedMessage) {
        setMessage(savedMessage);
      }
    } catch {
      // Ignore if localStorage is not available
    }
  }, []);

  // Save message to local storage as user types (persistent but not Chrome storage)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        if (message.trim()) {
          window.localStorage.setItem('prompt-cast-temp-message', message);
        } else {
          window.localStorage.removeItem('prompt-cast-temp-message');
        }
      } catch {
        // Ignore if localStorage is not available
      }
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

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
      // Add to history before clearing the message
      addToHistory(message);
      setMessage('');
      // Clear the temporary message from local storage when successfully sent
      try {
        window.localStorage.removeItem('prompt-cast-temp-message');
      } catch {
        // Ignore if localStorage is not available
      }
      // Refocus the input after successful send
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
    }
  };

  const onArrowUp = () => {
    const lastPrompt = getLastPrompt();
    if (lastPrompt) {
      setMessage(lastPrompt);
      // Focus the input and position cursor at the end
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
          messageInputRef.current.setSelectionRange(lastPrompt.length, lastPrompt.length);
        }
      }, 0);
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
              onArrowUp={onArrowUp}
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
