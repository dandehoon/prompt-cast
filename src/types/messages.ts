/**
 * Message types for Chrome extension communication
 */
import type {
  ExtensionMessageType,
  ContentMessageType,
} from '../shared/constants';

// Chrome Extension Message Types
export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: unknown;
}

// Content Script Message Types
export interface ContentMessage {
  type: ContentMessageType;
  payload?: {
    message?: string;
  };
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
