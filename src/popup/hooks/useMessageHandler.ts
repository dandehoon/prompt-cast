import { useState, useCallback } from 'react';
import { ChromeMessaging } from '../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import type {
  ExtensionMessage,
  SendMessagePayload,
} from '../../types/messages';
import { CONFIG } from '../../shared/config';
import { logger } from '../../shared/logger';
import { sleep } from '../../shared/utils';

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

  /**
   * Check if background script is responsive
   */
  const checkBackgroundHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await ChromeMessaging.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.GET_SITE_CONFIGS,
        payload: {},
      } as ExtensionMessage);

      return response.success;
    } catch (error) {
      logger.error('Background health check failed:', error);
      return false;
    }
  }, []);

  /**
   * Send message with health check and retry logic
   */
  const handleSendMessage = useCallback(
    async (message: string, retryCount = 0): Promise<boolean> => {
      const trimmedMessage = message.trim();
      const maxRetries = 2;

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

        // Check background script health before sending
        const isHealthy = await checkBackgroundHealth();
        if (!isHealthy) {
          if (retryCount < maxRetries) {
            showToast('Service not ready, retrying...', 'info');
            await sleep(1000); // Wait 1 second before retry
            return handleSendMessage(message, retryCount + 1);
          } else {
            throw new Error(
              'Background service is not responding. Please try closing and reopening the popup.',
            );
          }
        }

        showToast('Preparing to send message...', 'info');

        const payload: SendMessagePayload = {
          message: trimmedMessage,
          sites: enabledSites,
        };

        // Send message with enhanced error handling
        const response = await ChromeMessaging.sendMessage({
          type: EXTENSION_MESSAGE_TYPES.SEND_MESSAGE,
          payload,
        } as ExtensionMessage);

        if (response.success) {
          showToast(`Message sent to ${enabledSites.length} sites`, 'success');

          // Verify message delivery with a short delay
          setTimeout(async () => {
            try {
              await refreshSiteStates();
            } catch (error) {
              logger.warn(
                'Failed to refresh site states after sending:',
                error,
              );
            }
          }, CONFIG.popup.sites.refreshDelay);

          return true;
        } else {
          const errorMsg = response.error || 'Failed to send message';

          // Retry on certain errors
          if (
            retryCount < maxRetries &&
            (errorMsg.includes('Extension context invalidated') ||
              errorMsg.includes('not responding') ||
              errorMsg.includes('disconnected'))
          ) {
            showToast(
              `Send failed, retrying... (${retryCount + 1}/${maxRetries})`,
              'info',
            );
            await sleep(1000);
            return handleSendMessage(message, retryCount + 1);
          }

          throw new Error(errorMsg);
        }
      } catch (error) {
        logger.error('Failed to send message:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';

        if (
          retryCount < maxRetries &&
          errorMessage.includes('Extension context invalidated')
        ) {
          showToast('Connection lost, retrying...', 'info');
          await sleep(1000);
          return handleSendMessage(message, retryCount + 1);
        }

        showToast(errorMessage, 'error');
        return false;
      } finally {
        setSendLoading(false);
      }
    },
    [getEnabledSites, refreshSiteStates, showToast, checkBackgroundHealth],
  );

  return {
    sendLoading,
    handleSendMessage,
    checkBackgroundHealth,
  };
}
