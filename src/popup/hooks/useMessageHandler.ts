import { useState, useCallback } from 'react';
import { ChromeMessaging } from '../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import { ExtensionMessage, SendMessagePayload } from '../../shared/types';
import { CONFIG } from '../../shared/config';
import { logger } from '../../shared/logger';

interface UseMessageHandlerProps {
  getEnabledSites: () => string[];
  refreshSiteStates: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useMessageHandler({
  getEnabledSites,
  refreshSiteStates,
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

      const enabledSites = getEnabledSites();

      if (enabledSites.length === 0) {
        showToast('Please enable at least one site', 'error');
        return false;
      }

      try {
        setSendLoading(true);
        showToast('Preparing to send message...', 'info');

        const payload: SendMessagePayload = {
          message: trimmedMessage,
          sites: enabledSites,
        };

        // Send message - the background site will handle opening tabs if needed
        const response = await ChromeMessaging.sendMessage({
          type: EXTENSION_MESSAGE_TYPES.SEND_MESSAGE,
          payload,
        } as ExtensionMessage);

        if (response.success) {
          showToast(`Message sent to ${enabledSites.length} sites`, 'success');
          // Update site states after sending
          setTimeout(
            () => refreshSiteStates(),
            CONFIG.popup.sites.refreshDelay,
          );
          return true;
        } else {
          throw new Error(response.error || 'Failed to send message');
        }
      } catch (error) {
        logger.error('Failed to send message:', error);
        showToast('Failed to send message', 'error');
        return false;
      } finally {
        setSendLoading(false);
      }
    },
    [getEnabledSites, refreshSiteStates, showToast],
  );

  return {
    sendLoading,
    handleSendMessage,
  };
}
