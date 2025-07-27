// Chrome Extension Message Types
export interface ExtensionMessage {
  type: string;
  payload?: any;
}

export interface Response<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

// AI Service Types
export type AIServiceId = 'chatgpt' | 'claude' | 'gemini' | 'grok';

export interface AIService {
  id: AIServiceId;
  name: string;
  url: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'loading' | 'error';
  tabId?: number;
}

export type ServiceConfig = Record<AIServiceId, AIService>;

// Content Script Message Types
export interface ContentMessage {
  type: 'INJECT_MESSAGE' | 'STATUS_CHECK';
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

// Service Selectors for Content Script (DEPRECATED - moved to serviceConfig.ts)
// export type ServiceSelectors = Record<AIServiceId, string[]>;

// Storage Types
export interface UserPreferences {
  services: Partial<Record<AIServiceId, { enabled: boolean }>>;
  lastMessage?: string;
}

// UI State Types
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}
