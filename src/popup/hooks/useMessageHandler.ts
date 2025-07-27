import { useState, useCallback } from 'react';
import { ChromeMessaging } from '../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import { ExtensionMessage, SendMessagePayload } from '../../shared/types';

interface UseMessageHandlerProps {
  getEnabledServices: () => string[];
  refreshServiceStates: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useMessageHandler({
  getEnabledServices,
  refreshServiceStates,
  showToast,
}: UseMessageHandlerProps) {
  const [sendLoading, setSendLoading] = useState(false);

  const handleSendMessage = useCallback(
    async (message: string) => {
      const trimmedMessage = message.trim();

      if (!trimmedMessage) {
        showToast('Please enter a message', 'error');
        return false;
      }

      const enabledServices = getEnabledServices();

      if (enabledServices.length === 0) {
        showToast('Please enable at least one service', 'error');
        return false;
      }

      try {
        setSendLoading(true);
        showToast('Preparing to send message...', 'info');

        const payload: SendMessagePayload = {
          message: trimmedMessage,
          services: enabledServices,
        };

        // Send message - the background service will handle opening tabs if needed
        const response = await ChromeMessaging.sendMessage({
          type: EXTENSION_MESSAGE_TYPES.SEND_MESSAGE,
          payload,
        } as ExtensionMessage);

        if (response.success) {
          showToast(
            `Message sent to ${enabledServices.length} services`,
            'success',
          );
          // Update service states after sending
          setTimeout(() => refreshServiceStates(), 1000);
          return true;
        } else {
          throw new Error(response.error || 'Failed to send message');
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        showToast('Failed to send message', 'error');
        return false;
      } finally {
        setSendLoading(false);
      }
    },
    [getEnabledServices, refreshServiceStates, showToast],
  );

  return {
    sendLoading,
    handleSendMessage,
  };
}
