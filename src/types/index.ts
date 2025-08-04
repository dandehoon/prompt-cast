/**
 * Centralized type exports for the extension
 * Import from here to get all types in one place
 */

// Core types
export type { Response } from './core';

// Message types
export type {
  ExtensionMessage,
  ContentMessage,
  SendMessagePayload,
  SiteTogglePayload,
  GetSiteByHostnamePayload,
} from './messages';

// Site types
export type { SiteConfig, SiteConfigsPayload, EnhancedSite } from './site';

// UI types
export type { ToastMessage, TabId, Tab } from './ui';

// Storage types
export type { UserPreferences } from './storage';

// Re-export types from constants
export type {
  SiteStatusType,
  ThemeOption,
  ToastType,
  ExtensionMessageType,
  ContentMessageType,
} from '../shared/constants';
