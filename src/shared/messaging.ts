import { defineExtensionMessaging } from '@webext-core/messaging';
import type {
  SendMessagePayload,
  SiteTogglePayload,
  SiteOrderPayload,
  SiteConfig,
  TabEventPayload,
  SiteTabsState,
} from '../types';

// Define the messaging protocol with webext-core for extension-wide communication
export interface ExtensionProtocolMap {
  // Message sending operations
  SEND_MESSAGE(data: SendMessagePayload): void;
  SITE_TOGGLE(data: SiteTogglePayload): void;
  SAVE_SITE_ORDER(data: SiteOrderPayload): void;
  FOCUS_TAB(data: { siteId: string }): void;
  CLOSE_ALL_TABS(): void;

  // Query operations that return data
  GET_SITE_CONFIGS(): { data: { configs: Record<string, SiteConfig> } };
  GET_SITE_ORDER(): { order: string[] };
  GET_SITE_TABS(): SiteTabsState;

  // Event notifications (background -> sidepanel)
  TAB_EVENT(data: TabEventPayload): void;
}

// Export the messaging functions with full type safety for extension communication
export const { sendMessage, onMessage } =
  defineExtensionMessaging<ExtensionProtocolMap>();
