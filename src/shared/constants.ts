/**
 * Extension Message Types
 * Centralized constants for all message types used throughout the extension
 */

// Background Script Message Types
export const EXTENSION_MESSAGE_TYPES = {
  // Tab operations
  CLOSE_ALL_TABS: 'CLOSE_ALL_TABS',
  FOCUS_TAB: 'FOCUS_TAB',

  // Site operations
  SITE_TOGGLE: 'SITE_TOGGLE',
  SEND_MESSAGE: 'SEND_MESSAGE',

  // Site configuration
  GET_SITE_CONFIGS: 'GET_SITE_CONFIGS',
  GET_SITE_BY_URL: 'GET_SITE_BY_URL',
  GET_SITE_STATUS: 'GET_SITE_STATUS',
} as const;

// Toast/Notification Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
} as const;

// Site Status Types
export const SITE_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  LOADING: 'loading',
  ERROR: 'error',
} as const;

// Theme Types
export const THEME_OPTIONS = {
  AUTO: 'auto',
  LIGHT: 'light',
  DARK: 'dark',
} as const;

// Export type definitions for TypeScript
export type ToastType = (typeof TOAST_TYPES)[keyof typeof TOAST_TYPES];
export type SiteStatusType = (typeof SITE_STATUS)[keyof typeof SITE_STATUS];
export type ThemeOption = (typeof THEME_OPTIONS)[keyof typeof THEME_OPTIONS];
