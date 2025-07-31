import {
  ExtensionMessageType,
  ContentMessageType,
  ToastType,
  SiteStatusType,
  ThemeOption,
} from './constants';

// Chrome Extension Message Types
export interface ExtensionMessage {
  type: ExtensionMessageType;
  payload?: unknown;
}

export interface Response<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface AISite {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export type SiteConfig = Record<string, AISite>;

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

// Storage Types
export interface UserPreferences {
  sites: Partial<Record<string, { enabled: boolean }>>;
  theme?: ThemeOption;
}

// UI State Types
export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Tab Types
export type TabId = 'home' | 'settings';

export interface Tab {
  id: TabId;
  label: string;
  icon?: string;
}

// Re-export types from constants
export type {
  SiteStatusType,
  ThemeOption,
  ToastType,
  ExtensionMessageType,
  ContentMessageType,
};
