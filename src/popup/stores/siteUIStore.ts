import { create } from 'zustand';
import type {
  SiteConfig,
  EnhancedSite,
  SiteConfigsPayload,
} from '../../types/site';
import type { SiteStatusType } from '../../shared/constants';
import { SITE_STATUS, EXTENSION_MESSAGE_TYPES } from '../../shared/constants';
import { getAllSiteConfigs } from '../../background/config/siteConfig';
import { ChromeMessaging } from '../../shared/messaging';

interface SiteUIStore {
  // State
  siteConfigs: Record<string, SiteConfig>;
  siteStatuses: Record<string, SiteStatusType>;
  siteStates: Record<string, { enabled: boolean }>;

  // Getters
  getSiteWithStatus: (siteId: string, isDark?: boolean) => EnhancedSite | null;
  getEnabledSites: () => string[];
  getEnabledCount: () => number;
  getConnectedCount: () => number;
  getAllSitesWithStatus: (isDark?: boolean) => Record<string, EnhancedSite>;
  getSiteColor: (siteId: string, isDark?: boolean) => string;

  // Actions
  updateSiteStatus: (siteId: string, status: SiteStatusType) => void;
  toggleSite: (siteId: string, enabled: boolean) => void;
  initializeSites: () => void;
  refreshSiteStates: () => Promise<void>;
  syncConfigsToBackground: () => Promise<void>;
}

export const useSiteUIStore = create<SiteUIStore>((set, get) => ({
  // Initial state
  siteConfigs: getAllSiteConfigs(),
  siteStatuses: {},
  siteStates: {},

  // Getters
  getSiteWithStatus: (siteId: string, isDark = false): EnhancedSite | null => {
    const state = get();
    const config = state.siteConfigs[siteId];
    if (!config) return null;

    // Generate color inline instead of using getSiteColors
    const color = isDark ? config.colors.dark : config.colors.light;

    return {
      ...config,
      status: state.siteStatuses[siteId] || SITE_STATUS.DISCONNECTED,
      enabled: state.siteStates[siteId]?.enabled ?? config.enabled,
      color,
    };
  },

  getEnabledSites: (): string[] => {
    const state = get();
    return Object.keys(state.siteConfigs).filter((siteId) => {
      const siteState = state.siteStates[siteId];
      return siteState?.enabled ?? state.siteConfigs[siteId].enabled;
    });
  },

  getEnabledCount: (): number => {
    return get().getEnabledSites().length;
  },

  getConnectedCount: (): number => {
    const state = get();
    return get()
      .getEnabledSites()
      .filter((siteId) => state.siteStatuses[siteId] === SITE_STATUS.CONNECTED)
      .length;
  },

  getAllSitesWithStatus: (isDark = false): Record<string, EnhancedSite> => {
    const state = get();
    const result: Record<string, EnhancedSite> = {};
    Object.keys(state.siteConfigs).forEach((siteId) => {
      const site = get().getSiteWithStatus(siteId, isDark);
      if (site) {
        result[siteId] = site;
      }
    });
    return result;
  },

  getSiteColor: (siteId: string, isDark = false): string => {
    const state = get();
    const config = state.siteConfigs[siteId];
    if (!config) {
      return isDark ? '#6b7280' : '#6b7280';
    }
    return isDark ? config.colors.dark : config.colors.light;
  },

  // Actions
  updateSiteStatus: (siteId: string, status: SiteStatusType) => {
    set((state) => ({
      siteStatuses: {
        ...state.siteStatuses,
        [siteId]: status,
      },
    }));
  },

  toggleSite: (siteId: string, enabled: boolean) => {
    set((state) => ({
      siteStates: {
        ...state.siteStates,
        [siteId]: { enabled },
      },
    }));
  },

  initializeSites: () => {
    const state = get();
    const initialStates: Record<string, { enabled: boolean }> = {};
    Object.keys(state.siteConfigs).forEach((siteId) => {
      initialStates[siteId] = { enabled: state.siteConfigs[siteId].enabled };
    });

    set({
      siteStates: initialStates,
      siteStatuses: {},
    });
  },

  refreshSiteStates: async () => {
    // This will be implemented to query tabs and update statuses
    // For now, we'll set a placeholder implementation
    const state = get();
    const updates: Record<string, SiteStatusType> = {};

    // Simulate checking site states (placeholder)
    Object.keys(state.siteConfigs).forEach((siteId) => {
      updates[siteId] = SITE_STATUS.DISCONNECTED;
    });

    set((state) => ({
      siteStatuses: {
        ...state.siteStatuses,
        ...updates,
      },
    }));
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
      console.error('Failed to sync configs to background:', error);
    }
  },
}));

// Initialize the store when it's first used
const store = useSiteUIStore.getState();
store.initializeSites();

// Sync initial configuration to background
if (typeof chrome !== 'undefined' && chrome.runtime) {
  store.syncConfigsToBackground().catch((error) => {
    console.warn(
      'Initial background sync failed - this is expected if called outside extension context:',
      error,
    );
  });
}
