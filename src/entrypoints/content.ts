import { defineContentScript } from '#imports';
import { ContentScript } from '@/content';
import { getContentScriptMatches } from '@/shared/siteUrls';

export default defineContentScript({
  // Automatically generated from centralized site configuration
  matches: getContentScriptMatches(),
  main() {
    // Initialize content script only if window is available
    if (typeof window !== 'undefined') {
      new ContentScript();
    }
  },
});
