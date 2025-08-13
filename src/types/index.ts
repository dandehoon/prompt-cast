/**
 * Centralized type exports for the extension
 * Import from here to get all types in one place
 */

// Core types
export * from './core';
export * from './messages';
export * from './siteConfig';
export * from './storage';
export * from './ui';

// Re-export from shared constants
export type { ThemeOption, ToastType } from '../shared/constants';
