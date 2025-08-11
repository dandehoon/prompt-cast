import { beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

// Reset fake browser state before each test
// This provides a clean Chrome extension API environment for each test
beforeEach(() => {
  fakeBrowser.reset();
});

// Note: WXT's fakeBrowser automatically provides:
// - chrome.* APIs
// - browser.* APIs
// - storage APIs with in-memory implementation
// - tabs APIs
// - runtime messaging APIs
// - All other Chrome extension APIs

// The WxtVitest plugin in vitest.config.ts automatically:
// - Sets up the fake browser environment
// - Configures auto-imports from WXT
// - Applies WXT vite plugins
// - Sets up global variables (import.meta.env.BROWSER, etc.)
// - Configures aliases (@/*, @@/*, etc.)
