import { defineExtensionMessaging } from '@webext-core/messaging';
import type {
  SendMessagePayload,
  SiteTogglePayload,
  SiteConfig,
} from '../types';
import type { SiteStatusType } from '@/shared';

// Define the messaging protocol with webext-core for extension-wide communication
export interface ExtensionProtocolMap {
  // Message sending operations
  SEND_MESSAGE(data: SendMessagePayload): void;
  SITE_TOGGLE(data: SiteTogglePayload): void;
  FOCUS_TAB(data: { siteId: string }): void;
  CLOSE_ALL_TABS(): void;

  // Query operations that return data
  GET_SITE_CONFIGS(): { data: { configs: Record<string, SiteConfig> } };
  GET_SITE_BY_URL(data: { url: string }): {
    config: SiteConfig | null;
  };
  GET_SITE_STATUS(data: { siteId: string }): {
    status: SiteStatusType;
  };
}

// Export the messaging functions with full type safety for extension communication
export const { sendMessage, onMessage } =
  defineExtensionMessaging<ExtensionProtocolMap>();
