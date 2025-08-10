import { defineExtensionMessaging } from '@webext-core/messaging';

// Define content script specific messaging protocol
export interface ContentProtocolMap {
  // Status check for content script readiness
  STATUS_CHECK(): { ready: boolean };

  // Message injection into page input fields
  INJECT_MESSAGE(data: { message: string }): {
    success: boolean;
    error?: string;
  };
}

// Content script messaging for background -> content communication
export const { sendMessage: sendToContent, onMessage: onContentMessage } =
  defineExtensionMessaging<ContentProtocolMap>();
