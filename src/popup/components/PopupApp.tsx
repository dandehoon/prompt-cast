import React, { useState, useCallback, useEffect } from 'react';
import { ServiceCard } from './ServiceCard';
import { MessageInput } from './MessageInput';
import { StatusBar } from './StatusBar';
import { ToastContainer } from './Toast';
import { useServices } from '../hooks/useServices';
import { useStorage } from '../hooks/useStorage';
import { useToast } from '../hooks/useToast';
import { ChromeMessaging } from '../../shared/messaging';
import {
  AIService,
  AIServiceId,
  ExtensionMessage,
  SendMessagePayload,
  ServiceTogglePayload,
} from '../../shared/types';

export function PopupApp() {
  const [message, setMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [closeAllLoading, setCloseAllLoading] = useState(false);

  const {
    services,
    toggleService,
    refreshServiceStates,
    getEnabledServices,
    getConnectedCount,
    getEnabledCount,
  } = useServices();

  const { preferences, updateServiceEnabled } = useStorage();
  const { toasts, showToast, removeToast } = useToast();

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

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      showToast('Please enter a message', 'error');
      return;
    }

    const enabledServices = getEnabledServices();

    if (enabledServices.length === 0) {
      showToast('Please enable at least one service', 'error');
      return;
    }

    try {
      setSendLoading(true);

      // Check if any enabled services need to be opened
      const needsLaunch = enabledServices.some((serviceId: string) => {
        const service = services[serviceId as AIServiceId];
        return service.status === 'disconnected';
      });

      if (needsLaunch) {
        showToast('Opening AI service tabs...', 'info');

        const launchResponse = await ChromeMessaging.sendMessage({
          type: 'OPEN_TABS',
        } as ExtensionMessage);

        if (!launchResponse.success) {
          throw new Error('Failed to launch tabs: ' + launchResponse.error);
        }

        // Update service states after opening tabs
        await refreshServiceStates();
      }

      // Check if any tabs need to be opened and give appropriate feedback
      const connectedServices = Object.values(services).filter(s => s.enabled && s.status === 'connected').length;
      const enabledServicesCount = enabledServices.length;

      if (connectedServices === 0 && enabledServicesCount > 0) {
        showToast('Opening tabs and preparing services...', 'info');
      } else {
        showToast('Sending message...', 'info');
      }

      const payload: SendMessagePayload = {
        message: trimmedMessage,
        services: enabledServices,
      };

      const response = await ChromeMessaging.sendMessage({
        type: 'SEND_MESSAGE',
        payload,
      } as ExtensionMessage);

      if (response.success) {
        showToast(`Message sent to ${enabledServices.length} services`, 'success');
        setMessage('');
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('Failed to send message', 'error');
    } finally {
      setSendLoading(false);
    }
  }, [
    message,
    services,
    getEnabledServices,
    refreshServiceStates,
    showToast,
  ]);

  const handleCloseAllTabs = useCallback(async () => {
    try {
      setCloseAllLoading(true);

      const response = await ChromeMessaging.sendMessage({
        type: 'CLOSE_ALL_TABS',
      } as ExtensionMessage);

      if (response.success) {
        showToast('All AI tabs closed', 'info');
        await refreshServiceStates();
      } else {
        throw new Error(response.error || 'Failed to close tabs');
      }
    } catch (error) {
      console.error('Failed to close tabs:', error);
      showToast('Failed to close tabs', 'error');
    } finally {
      setCloseAllLoading(false);
    }
  }, [refreshServiceStates, showToast]);

  const handleServiceToggle = useCallback(
    async (serviceId: AIServiceId, enabled: boolean) => {
      try {
        // Update local state immediately
        toggleService(serviceId, enabled);

        // Update storage
        await updateServiceEnabled(serviceId, enabled);

        // Notify background script
        const payload: ServiceTogglePayload = { serviceId, enabled };
        await ChromeMessaging.sendMessage({
          type: 'SERVICE_TOGGLE',
          payload,
        } as ExtensionMessage);

        const service = services[serviceId];
        showToast(`${service.name} ${enabled ? 'enabled' : 'disabled'}`, 'info');
      } catch (error) {
        console.error('Failed to toggle service:', error);
        showToast('Failed to update service', 'error');
        // Revert local state on error
        toggleService(serviceId, !enabled);
      }
    },
    [services, toggleService, updateServiceEnabled, showToast],
  );

  const handleCloseTab = useCallback(
    async (serviceId: AIServiceId) => {
      try {
        const response = await ChromeMessaging.sendMessage({
          type: 'CLOSE_TAB',
          payload: { serviceId },
        } as ExtensionMessage);

        if (response.success) {
          const service = services[serviceId];
          showToast(`${service.name} tab closed`, 'info');
          await refreshServiceStates();
        } else {
          throw new Error(response.error || 'Failed to close tab');
        }
      } catch (error) {
        console.error('Failed to close tab:', error);
        showToast('Failed to close tab', 'error');
      }
    },
    [services, refreshServiceStates, showToast],
  );

  const handleFocusTab = useCallback(
    async (serviceId: AIServiceId) => {
      try {
        const service = services[serviceId];

        if (service.status === 'disconnected') {
          showToast(`Opening ${service.name}...`, 'info');
        }

        const response = await ChromeMessaging.sendMessage({
          type: 'FOCUS_TAB',
          payload: { serviceId },
        } as ExtensionMessage);

        if (response.success) {
          if (service.status === 'connected') {
            showToast(`Switched to ${service.name}`, 'info');
          }
          await refreshServiceStates();
        } else {
          throw new Error(response.error || 'Failed to focus tab');
        }
      } catch (error) {
        console.error('Failed to focus tab:', error);
        showToast('Failed to focus tab', 'error');
      }
    },
    [services, refreshServiceStates, showToast],
  );

  const hasMessage = message.trim().length > 0;
  const connectedCount = getConnectedCount();
  const enabledCount = getEnabledCount();

  return (
    <div className="w-80 min-h-0 bg-ai-dark text-ai-text">
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-ai-border">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
            <h1 className="text-lg font-semibold">Multi-AI Hub</h1>
          </div>
          <div className="text-xs text-ai-text-secondary">v1.0.0</div>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-4">
          {/* Services Grid */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">AI Services</h2>
            <div className="grid grid-cols-2 gap-2">
              {(Object.values(services) as AIService[]).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onToggle={handleServiceToggle}
                  onCloseTab={handleCloseTab}
                  onFocusTab={handleFocusTab}
                />
              ))}
            </div>
          </div>

          {/* Message Input */}
          <MessageInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            disabled={sendLoading}
          />
        </main>

        {/* Footer Controls */}
        <footer className="p-4 border-t border-ai-border space-y-3">
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!hasMessage || sendLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {sendLoading ? 'Sending...' : 'Send'}
          </button>

          {/* Close All Button */}
          <button
            onClick={handleCloseAllTabs}
            disabled={closeAllLoading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
          >
            {closeAllLoading ? 'Closing...' : 'Close All Tabs'}
          </button>

          {/* Status Bar */}
          <StatusBar connectedCount={connectedCount} enabledCount={enabledCount} />
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
