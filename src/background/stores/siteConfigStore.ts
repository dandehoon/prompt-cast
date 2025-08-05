import { create } from 'zustand';
import type { SiteConfig, SiteConfigsPayload } from '../../types/site';
import { getAllSiteConfigs } from '../config/siteConfig';
import { EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import { ChromeMessaging } from '../../shared/messaging';
import { logger } from '../../shared/logger';

interface SiteConfigStore {
  // State
  siteConfigs: Record<string, SiteConfig>;
  siteStates: Record<string, { enabled: boolean }>;

  // Getters
  getSiteConfig: (siteId: string) => SiteConfig | null;
  getAllConfigs: () => Record<string, SiteConfig>;
  getEnabledSites: () => string[];

  // Actions
  updateSiteEnabled: (siteId: string, enabled: boolean) => void;
  initializeConfigs: () => void;
  syncConfigsToBackground: () => Promise<void>;
}

export const useSiteConfigStore = create<SiteConfigStore>((set, get) => ({
  // Initial state
  siteConfigs: getAllSiteConfigs(),
  siteStates: {},

  // Getters
  getSiteConfig: (siteId: string): SiteConfig | null => {
    const state = get();
    return state.siteConfigs[siteId] || null;
  },

  getAllConfigs: (): Record<string, SiteConfig> => {
    return get().siteConfigs;
  },

  getEnabledSites: (): string[] => {
    const state = get();
    return Object.keys(state.siteConfigs).filter((siteId) => {
      const siteState = state.siteStates[siteId];
      return siteState?.enabled ?? state.siteConfigs[siteId].enabled;
    });
  },

  // Actions
  updateSiteEnabled: (siteId: string, enabled: boolean) => {
    set((state) => ({
      siteStates: {
        ...state.siteStates,
        [siteId]: { enabled },
      },
    }));
  },

  initializeConfigs: () => {
    const state = get();
    const initialStates: Record<string, { enabled: boolean }> = {};
    Object.keys(state.siteConfigs).forEach((siteId) => {
      initialStates[siteId] = { enabled: state.siteConfigs[siteId].enabled };
    });

    set({
      siteStates: initialStates,
    });
  },

  syncConfigsToBackground: async () => {
    try {
      const state = get();
      const configsPayload: SiteConfigsPayload = {
        configs: Object.fromEntries(
          Object.entries(state.siteConfigs).map(([id, config]) => [id, config]),
        ),
      };

      await ChromeMessaging.sendMessage({
        type: EXTENSION_MESSAGE_TYPES.UPDATE_SITE_CONFIGS,
        payload: configsPayload,
      });
    } catch (error) {
      logger.error('Failed to sync configs to background:', error);
    }
  },
}));

// Initialize the store when it's first used
const store = useSiteConfigStore.getState();
store.initializeConfigs();
