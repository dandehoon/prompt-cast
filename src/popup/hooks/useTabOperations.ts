import { useState, useCallback } from 'react';
import { ChromeMessaging } from '../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import { AIServiceId, AIService, ExtensionMessage, ServiceTogglePayload } from '../../shared/types';

interface UseTabOperationsProps {
  services: Record<AIServiceId, AIService>;
  toggleService: (serviceId: AIServiceId, enabled: boolean) => void;
  updateServiceEnabled: (
    serviceId: AIServiceId,
    enabled: boolean,
  ) => Promise<void>;
  refreshServiceStates: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useTabOperations({
  services,
  toggleService,
  updateServiceEnabled,
  refreshServiceStates,
  showToast,
}: UseTabOperationsProps) {
  const [closeAllLoading, setCloseAllLoading] = useState(false);

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
          type: EXTENSION_MESSAGE_TYPES.SERVICE_TOGGLE,
          payload,
        } as ExtensionMessage);

        const service = services[serviceId];
        showToast(
          `${service.name} ${enabled ? 'enabled' : 'disabled'}`,
          'info',
        );
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
          type: EXTENSION_MESSAGE_TYPES.CLOSE_TAB,
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
          type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB,
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

  const handleCloseAllTabs = useCallback(async () => {
    try {
      setCloseAllLoading(true);

      const response = await ChromeMessaging.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS,
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

  return {
    closeAllLoading,
    handleServiceToggle,
    handleCloseTab,
    handleFocusTab,
    handleCloseAllTabs,
  };
}
