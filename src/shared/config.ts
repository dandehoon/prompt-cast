/**
 * Centralized configuration for the Prompt Cast extension.
 * All timing, retry, and duration settings are defined here for easy maintenance.
 */

/**
 * Background site configuration for tab management and message handling
 */
export const BACKGROUND_CONFIG = {
  /**
   * Content script readiness detection
   */
  contentScript: {
    /** Maximum attempts to check if content script is ready */
    maxReadinessAttempts: 10,
    /** Delay between content script readiness checks (ms) */
    readinessCheckDelay: 500,
  },

  /**
   * Tab management configuration
   */
  tab: {
    /** Maximum attempts to wait for tab to be ready */
    maxReadyAttempts: 40,
    /** Interval for tab ready status polling (ms) */
    readyCheckInterval: 250,
  },

  /**
   * Message retry configuration
   */
  messageRetry: {
    /** Maximum retry attempts for message sending */
    maxRetries: 3,
    /** Base delay for exponential backoff (ms) */
    baseDelay: 500,
    /** Maximum delay for exponential backoff (ms) */
    maxDelay: 1500,
  },
} as const;

/**
 * Content script configuration for DOM interaction and message injection
 */
export const CONTENT_CONFIG = {
  /**
   * Input element detection
   */
  input: {
    /** Maximum attempts to find input element during injection */
    maxInjectionAttempts: 15,
    /** Maximum attempts for input readiness checking */
    maxReadinessAttempts: 10,
    /** Delay between input detection attempts (ms) */
    detectionDelay: 100,
  },

  /**
   * DOM interaction timing
   */
  dom: {
    /** Delay after focusing element before interaction (ms) */
    focusDelay: 50,
    /** Delay after message injection before sending (ms) */
    injectionDelay: 200,
  },

  /**
   * Input readiness polling
   */
  polling: {
    /** Maximum attempts for input ready polling */
    maxPollingAttempts: 20,
    /** Interval for input ready status checking (ms) */
    pollingInterval: 500,
  },

  /**
   * DOM observer configuration
   */
  observer: {
    /** Timeout for DOM mutation observer (ms) */
    timeout: 15000,
  },
} as const;

/**
 * Popup UI configuration for user interface interactions
 */
export const POPUP_CONFIG = {
  /**
   * Toast notification settings
   */
  toast: {
    /** Default duration for toast messages (ms) */
    defaultDuration: 3000,
  },

  /**
   * Site state management
   */
  sites: {
    /** Delay for refreshing site states after operations (ms) */
    refreshDelay: 1000,
  },
} as const;

/**
 * Test configuration for consistent test timing
 */
export const TEST_CONFIG = {
  /** Standard delay for async test operations (ms) */
  asyncDelay: 100,
  /** Extended delay for integration tests (ms) */
  integrationDelay: 150,
  /** Toast duration for tests (ms) */
  toastDuration: 1000,
} as const;

/**
 * Combined configuration object for easy access
 */
export const CONFIG = {
  background: BACKGROUND_CONFIG,
  content: CONTENT_CONFIG,
  popup: POPUP_CONFIG,
  test: TEST_CONFIG,
} as const;

/**
 * Type definitions for configuration objects
 */
export type BackgroundConfig = typeof BACKGROUND_CONFIG;
export type ContentConfig = typeof CONTENT_CONFIG;
export type PopupConfig = typeof POPUP_CONFIG;
export type TestConfig = typeof TEST_CONFIG;
export type AppConfig = typeof CONFIG;
