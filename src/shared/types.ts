import {
  ExtensionMessageType,
  ContentMessageType,
  ToastType,
  ServiceStatusType,
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

export interface AIService {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  status: ServiceStatusType;
  tabId?: number;
}

export type ServiceConfig = Record<string, AIService>;

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
  services: string[];
}

export interface ServiceTogglePayload {
  serviceId: string;
  enabled: boolean;
}

// Storage Types
export interface UserPreferences {
  services: Partial<Record<string, { enabled: boolean }>>;
  lastMessage?: string;
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
