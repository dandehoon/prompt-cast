/**
 * UI-specific types for the popup interface
 */
import type { ToastType } from '../shared/constants';

// Toast/Notification Types
export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  timestamp?: number;
}

// Tab Types
export type TabId = 'home' | 'settings';

export interface Tab {
  id: TabId;
  label: string;
  icon?: string;
}
