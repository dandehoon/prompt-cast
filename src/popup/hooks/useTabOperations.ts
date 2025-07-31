import { useState, useCallback } from 'react';
import { ChromeMessaging } from '../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import {
  AISite,
  ExtensionMessage,
  SiteTogglePayload,
  SiteStatusType,
} from '../../shared/types';
import { logger } from '../../shared/logger';

// Extended site interface for popup hooks (includes computed status)
interface PopupSite extends AISite {
  status: SiteStatusType;
}

interface UseTabOperationsProps {
  sites: Record<string, PopupSite>;
  toggleSite: (siteId: string, enabled: boolean) => void;
  updateSiteEnabled: (siteId: string, enabled: boolean) => Promise<void>;
  refreshSiteStates: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function useTabOperations({
  sites,
  toggleSite,
  updateSiteEnabled,
  refreshSiteStates,
  showToast,
}: UseTabOperationsProps) {
  const [closeAllLoading, setCloseAllLoading] = useState(false);

  const handleSiteToggle = useCallback(
    async (siteId: string, enabled: boolean) => {
      try {
        const site = sites[siteId];

        // Update local state immediately
        toggleSite(siteId, enabled);

        // Update storage
        await updateSiteEnabled(siteId, enabled);

        // Notify background script
        const payload: SiteTogglePayload = { siteId: siteId, enabled };
        await ChromeMessaging.sendMessage({
          type: EXTENSION_MESSAGE_TYPES.SITE_TOGGLE,
          payload,
        } as ExtensionMessage);

        showToast(`${site.name} ${enabled ? 'enabled' : 'disabled'}`, 'info');
      } catch (error) {
        logger.error('Failed to toggle site:', error);
        showToast('Failed to update site', 'error');
        // Revert local state on error
        toggleSite(siteId, !enabled);
      }
    },
    [sites, toggleSite, updateSiteEnabled, showToast],
  );

  const handleFocusTab = useCallback(
    async (siteId: string) => {
      try {
        const site = sites[siteId];

        // Don't focus disabled sites
        if (!site.enabled) {
          showToast(`${site.name} is disabled`, 'error');
          return;
        }

        if (site.status === 'disconnected') {
          showToast(`Opening ${site.name}...`, 'info');
        }

        const response = await ChromeMessaging.sendMessage({
          type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB,
          payload: { siteId },
        } as ExtensionMessage);

        if (response.success) {
          await refreshSiteStates();
        } else {
          throw new Error(response.error || 'Failed to focus tab');
        }
      } catch (error) {
        logger.error('Failed to focus tab:', error);
        showToast('Failed to focus tab', 'error');
      }
    },
    [sites, refreshSiteStates, showToast],
  );

  const handleCloseAllTabs = useCallback(async () => {
    try {
      setCloseAllLoading(true);

      const response = await ChromeMessaging.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS,
      } as ExtensionMessage);

      if (response.success) {
        await refreshSiteStates();
      } else {
        throw new Error(response.error || 'Failed to close tabs');
      }
    } catch (error) {
      logger.error('Failed to close tabs:', error);
      showToast('Failed to close tabs', 'error');
    } finally {
      setCloseAllLoading(false);
    }
  }, [refreshSiteStates, showToast]);

  return {
    closeAllLoading,
    handleSiteToggle,
    handleFocusTab,
    handleCloseAllTabs,
  };
}
