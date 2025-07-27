/**
 * Extension Message Types
 * Centralized constants for all message types used throughout the extension
 */

// Background Script Message Types
export const EXTENSION_MESSAGE_TYPES = {
  // Tab operations
  OPEN_TABS: 'OPEN_TABS',
  CLOSE_TAB: 'CLOSE_TAB',
  CLOSE_ALL_TABS: 'CLOSE_ALL_TABS',
  FOCUS_TAB: 'FOCUS_TAB',
  
  // Service operations
  SERVICE_TOGGLE: 'SERVICE_TOGGLE',
  SEND_MESSAGE: 'SEND_MESSAGE',
  
  // Status updates
  TAB_STATUS_UPDATE: 'TAB_STATUS_UPDATE',
} as const;

// Content Script Message Types
export const CONTENT_MESSAGE_TYPES = {
  INJECT_MESSAGE: 'INJECT_MESSAGE',
  STATUS_CHECK: 'STATUS_CHECK',
  INPUT_READY: 'INPUT_READY',
} as const;

// Toast/Notification Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
} as const;

// Service Status Types
export const SERVICE_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  LOADING: 'loading',
  ERROR: 'error',
} as const;

// Export type definitions for TypeScript
export type ExtensionMessageType = typeof EXTENSION_MESSAGE_TYPES[keyof typeof EXTENSION_MESSAGE_TYPES];
export type ContentMessageType = typeof CONTENT_MESSAGE_TYPES[keyof typeof CONTENT_MESSAGE_TYPES];
export type ToastType = typeof TOAST_TYPES[keyof typeof TOAST_TYPES];
export type ServiceStatusType = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];
