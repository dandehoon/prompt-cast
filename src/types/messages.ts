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
