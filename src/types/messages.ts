/**
 * Message types for Chrome extension communication
 */

// Background Script Message Types
export interface SendMessagePayload {
  message: string;
  sites: string[];
}

export interface SiteTogglePayload {
  siteId: string;
  enabled: boolean;
}

export interface SiteOrderPayload {
  order: string[];
}

// Tab event types for comprehensive tab state tracking
export interface TabInfo {
  tabId: number;
  siteId: string;
  url: string;
  title?: string;
  isActive: boolean;
  isReady: boolean; // true when tab status is 'complete'
}

export interface TabEventPayload {
  eventType: 'created' | 'updated' | 'removed' | 'activated';
  affectedSiteId?: string; // site that was affected by the event
  currentActiveSiteId: string | null; // current active site after the event
  timestamp: number;
  tabInfo?: TabInfo; // actual tab info if available (for instant status updates)
}

export interface SiteTabsState {
  activeSiteId: string | null;
  siteTabs: Record<string, TabInfo | null>; // siteId -> TabInfo or null if no tab
}
