/**
 * Message types for Chrome extension communication
 */
import type { ExtensionMessageType } from '../shared/constants';

// Chrome Extension Message Types
export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: unknown;
}

// Background Script Message Types
export interface SendMessagePayload {
  message: string;
  sites: string[];
}

export interface SiteTogglePayload {
  siteId: string;
  enabled: boolean;
}

export interface GetSiteByHostnamePayload {
  hostname: string;
}
