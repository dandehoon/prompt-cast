# Updated Revamp Plan - Hybrid Approach

**Date:** 2025-11-05
**Based on:** " AI" reference + our architecture
**Approach:** Configuration-based rules + executeScript with allFrames

---

## Key Updates from Reference Extension

### 1. Enhanced Header Stripping (Keep Configurable)

**Changes:**

- Strip **6 headers** instead of 2
- Add special Google/Gemini request header handling
- Use configuration in TypeScript (not static JSON)

**Implementation in `src/background/headerStripper.ts`:**

```typescript
import { getAllSiteConfigs } from './siteConfigs';

interface HeaderRule {
  id: number;
  priority: number;
  action: {
    type: 'modifyHeaders';
    responseHeaders?: Array<{ header: string; operation: 'remove' }>;
    requestHeaders?: Array<{
      header: string;
      operation: 'remove' | 'set';
      value?: string;
    }>;
  };
  condition: {
    regexFilter: string;
    resourceTypes: string[];
  };
}

function createHeaderRules(): HeaderRule[] {
  const siteConfigs = getAllSiteConfigs();
  const sites = Object.values(siteConfigs);

  // Group sites by domain
  const regularSites = sites.filter((s) => !s.url.includes('google.com'));
  const googleSites = sites.filter((s) => s.url.includes('google.com'));

  const rules: HeaderRule[] = [];

  // Rule 1: Regular sites - strip 6 response headers
  if (regularSites.length > 0) {
    const domains = regularSites
      .map((s) => {
        const hostname = new URL(s.url).hostname.replace(/\./g, '\\.');
        return hostname;
      })
      .join('|');

    rules.push({
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'X-Frame-Options', operation: 'remove' },
          { header: 'Content-Security-Policy', operation: 'remove' },
          { header: 'Permissions-Policy', operation: 'remove' },
          { header: 'Cross-Origin-Opener-Policy', operation: 'remove' },
          { header: 'Cross-Origin-Embedder-Policy', operation: 'remove' },
          { header: 'X-Content-Type-Options', operation: 'remove' },
        ],
      },
      condition: {
        regexFilter: `.*(${domains}).*`,
        resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest', 'script'],
      },
    });
  }

  // Rule 2: Google/Gemini - modify request headers + strip response headers
  if (googleSites.length > 0) {
    const domains = googleSites
      .map((s) => {
        const hostname = new URL(s.url).hostname.replace(/\./g, '\\.');
        return hostname;
      })
      .join('|');

    rules.push({
      id: 2,
      priority: 2, // Higher priority for Google
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'X-Frame-Options', operation: 'remove' },
          { header: 'Content-Security-Policy', operation: 'remove' },
        ],
        requestHeaders: [
          { header: 'Sec-Fetch-Dest', operation: 'set', value: 'document' },
          { header: 'Sec-Fetch-Mode', operation: 'set', value: 'navigate' },
          { header: 'Sec-Fetch-Site', operation: 'set', value: 'none' },
          { header: 'Referer', operation: 'remove' },
          { header: 'Origin', operation: 'remove' },
        ],
      },
      condition: {
        regexFilter: `.*(${domains}).*`,
        resourceTypes: [
          'main_frame',
          'sub_frame',
          'xmlhttprequest',
          'script',
          'stylesheet',
          'image',
        ],
      },
    });
  }

  // Rule 100: Catch-all for sub_frames
  rules.push({
    id: 100,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { header: 'X-Frame-Options', operation: 'remove' },
        { header: 'Content-Security-Policy', operation: 'remove' },
        { header: 'Permissions-Policy', operation: 'remove' },
        { header: 'Cross-Origin-Opener-Policy', operation: 'remove' },
        { header: 'Cross-Origin-Embedder-Policy', operation: 'remove' },
      ],
    },
    condition: {
      regexFilter: '.*',
      resourceTypes: ['sub_frame'],
    },
  });

  return rules;
}

export async function setupHeaderStrippingRules(): Promise<void> {
  const rules = createHeaderRules();

  try {
    // Clear existing rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map((rule) => rule.id);

    // Update with new rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: rules,
    });

    console.log(
      '[HeaderStripper] Successfully set up',
      rules.length,
      'header stripping rules',
    );
  } catch (error) {
    console.error(
      '[HeaderStripper] Failed to set up header stripping rules:',
      error,
    );
    throw error;
  }
}

export async function removeHeaderStrippingRules(): Promise<void> {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: [],
    });

    console.log('[HeaderStripper] Removed all header stripping rules');
  } catch (error) {
    console.error(
      '[HeaderStripper] Failed to remove header stripping rules:',
      error,
    );
    throw error;
  }
}
```

**Manifest updates (no changes needed):**

- Already have `declarativeNetRequest` permission ✅
- Already have `host_permissions` ✅

---

### 2. Simplified Iframe Injection with executeScript

**Key insight:** Use `allFrames: true` instead of tracking frameIds!

**Updated `src/background/scriptInjector.ts`:**

```typescript
import type { SiteConfig } from '$types/siteConfig';
import { messageInjector } from './injections/messageInjector';

export class ScriptInjector {
  private mainPageTabId: number | null = null;

  setMainPageTab(tabId: number) {
    this.mainPageTabId = tabId;
  }

  /**
   * Inject message to all iframes in main page tab
   * Uses allFrames: true to target all iframes automatically
   */
  async injectMessageToAllIframes(
    message: string,
    sites: SiteConfig[],
  ): Promise<Record<string, boolean>> {
    if (!this.mainPageTabId) {
      console.error('[ScriptInjector] No main page tab set');
      return {};
    }

    try {
      // Inject into ALL frames (main + all iframes)
      // Each site config will be checked inside the injection function
      const results = await chrome.scripting.executeScript({
        target: {
          tabId: this.mainPageTabId,
          allFrames: true, // ← KEY: Injects into all iframes!
        },
        func: messageInjector,
        args: [message, sites],
      });

      // Parse results from each frame
      const successMap: Record<string, boolean> = {};
      results.forEach((result) => {
        if (result.result && typeof result.result === 'object') {
          Object.assign(successMap, result.result);
        }
      });

      return successMap;
    } catch (error) {
      console.error('[ScriptInjector] Injection failed:', error);
      return {};
    }
  }

  /**
   * Inject message with retry logic
   */
  async injectMessageWithRetry(
    message: string,
    sites: SiteConfig[],
    maxRetries = 3,
  ): Promise<Record<string, boolean>> {
    for (let i = 0; i < maxRetries; i++) {
      const results = await this.injectMessageToAllIframes(message, sites);

      // Check if any injections succeeded
      const anySuccess = Object.values(results).some((success) => success);
      if (anySuccess || i === maxRetries - 1) {
        return results;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {};
  }
}
```

**Updated injection function `src/background/injections/messageInjector.ts`:**

```typescript
import type { SiteConfig } from '@/types';

/**
 * This function runs inside EACH frame (main + all iframes)
 * It determines which site it's in and injects the message
 */
export function messageInjector(
  message: string,
  sites: SiteConfig[],
): Record<string, boolean> {
  const currentUrl = window.location.href;
  const result: Record<string, boolean> = {};

  // Find which site this frame belongs to
  const currentSite = sites.find((site) => {
    const siteHostname = new URL(site.url).hostname;
    return currentUrl.includes(siteHostname);
  });

  // If not an AI site frame, return empty
  if (!currentSite) {
    return result;
  }

  // Check if in chat context
  const isInChatContext =
    !currentSite.chatUriPatterns ||
    currentSite.chatUriPatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      const pathname = new URL(currentUrl).pathname;
      return regex.test(pathname);
    });

  if (!isInChatContext) {
    result[currentSite.id] = false;
    return result;
  }

  // Find input element
  let inputElement: HTMLElement | null = null;
  for (const selector of currentSite.inputSelectors) {
    inputElement = document.querySelector(selector);
    if (inputElement) break;
  }

  if (!inputElement) {
    result[currentSite.id] = false;
    return result;
  }

  // Inject message
  try {
    if (currentSite.injectionMethod === 'execCommand') {
      // Perplexity method
      inputElement.focus();
      document.execCommand('insertText', false, message);
    } else {
      // Standard method
      if (
        inputElement instanceof HTMLTextAreaElement ||
        inputElement instanceof HTMLInputElement
      ) {
        inputElement.value = message;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (inputElement.isContentEditable) {
        inputElement.textContent = message;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Auto-submit if configured (optional)
    if (currentSite.submitSelectors) {
      setTimeout(() => {
        for (const selector of currentSite.submitSelectors) {
          const submitBtn = document.querySelector(selector) as HTMLElement;
          if (submitBtn) {
            submitBtn.click();
            break;
          }
        }
      }, 100);
    }

    result[currentSite.id] = true;
  } catch (error) {
    console.error(`[InjectionError] ${currentSite.id}:`, error);
    result[currentSite.id] = false;
  }

  return result;
}
```

---

### 3. Simplified IframeManager

**No need for frameId tracking!** Just manage main page tab.

**Updated `src/background/iframeManager.ts`:**

```typescript
import { getAllSiteConfigs } from './siteConfigs';

export class IframeManager {
  private mainPageTabId: number | null = null;
  private enabledSites: string[] = [];

  async setMainPageTab(tabId: number) {
    this.mainPageTabId = tabId;
  }

  getMainPageTabId(): number | null {
    return this.mainPageTabId;
  }

  setEnabledSites(siteIds: string[]) {
    this.enabledSites = siteIds;
  }

  getEnabledSites(): string[] {
    return this.enabledSites;
  }

  /**
   * Reload all iframes by sending message to main page
   */
  async reloadAllIframes(): Promise<void> {
    if (!this.mainPageTabId) {
      throw new Error('Main page tab not set');
    }

    // Send message to main page to reload all iframes
    await chrome.tabs.sendMessage(this.mainPageTabId, {
      type: 'RELOAD_ALL_IFRAMES',
    });
  }

  /**
   * Reload specific iframe
   */
  async reloadIframe(siteId: string): Promise<void> {
    if (!this.mainPageTabId) {
      throw new Error('Main page tab not set');
    }

    await chrome.tabs.sendMessage(this.mainPageTabId, {
      type: 'RELOAD_IFRAME',
      siteId,
    });
  }

  /**
   * Open main page in new tab
   */
  async openMainPage(): Promise<void> {
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('/index.html'),
    });

    if (tab.id) {
      this.mainPageTabId = tab.id;
    }
  }
}
```

---

### 4. Updated MessageHandler

**Simplified - just inject to all frames:**

```typescript
import { IframeManager } from './iframeManager';
import { ScriptInjector } from './scriptInjector';
import { SiteManager } from './siteManager';

export class MessageHandler {
  constructor(
    private iframeManager: IframeManager,
    private scriptInjector: ScriptInjector,
    private siteManager: SiteManager,
  ) {}

  async sendMessageToIframes(
    message: string,
  ): Promise<Record<string, boolean>> {
    const enabledSites = await this.siteManager.getOrderedEnabledSites();

    // Simple: inject to all frames with all site configs
    const results = await this.scriptInjector.injectMessageWithRetry(
      message,
      enabledSites,
      3, // max retries
    );

    return results;
  }

  async reloadAllIframes(): Promise<void> {
    await this.iframeManager.reloadAllIframes();
  }
}
```

---

### 5. Main Page Message Listener

**Add to `src/entrypoints/index/main.ts`:**

```typescript
import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { logger } from '@/shared';

// Listen for reload messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'RELOAD_ALL_IFRAMES') {
    // Reload all iframes
    const iframes = document.querySelectorAll('iframe[data-site-id]');
    iframes.forEach((iframe: HTMLIFrameElement) => {
      const originalSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = originalSrc;
      }, 100);
    });
    sendResponse({ success: true });
  } else if (message.type === 'RELOAD_IFRAME') {
    // Reload specific iframe
    const iframe = document.querySelector(
      `iframe[data-site-id="${message.siteId}"]`,
    ) as HTMLIFrameElement;
    if (iframe) {
      const originalSrc = iframe.src;
      iframe.src = 'about:blank';
      setTimeout(() => {
        iframe.src = originalSrc;
      }, 100);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  return true; // Keep channel open for async response
});

// Initialize Svelte app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    mount(App, {
      target: container,
    });
  } else {
    logger.error('App root element not found');
  }
});
```

---

## Updated Task List

### ✅ Completed (Phase 1 & 2)

1. ✅ Header stripping infrastructure (needs update)
2. ✅ POC page
3. ✅ Main page entry point
4. ✅ Grid layout
5. ✅ SiteFrame component
6. ✅ ControlPanel component

### 🔄 Updated Tasks (Phase 3)

**Task 1A: Update Header Stripping Rules**

- Update `src/background/headerStripper.ts` with 6-header rules
- Add Google/Gemini special handling
- Test POC page

**Task 7: Create Simplified IframeManager**

- No frameId tracking
- Just manage main page tab
- Reload functionality

**Task 8: Update MessageHandler**

- Use simplified injection approach
- Remove complex readiness checking

**Task 9: Update ScriptInjector**

- Use `allFrames: true`
- Simplified injection function
- Built-in site detection

**Task 10: Implement New Chat**

- Add message listener in main page
- Reload all iframes functionality

**Task 11: Create iframeStore**

- Track injection results
- Simple state management

**Task 12: Wire up ControlPanel**

- Connect to background MessageHandler
- Send messages via messaging protocol

### Remaining Tasks (Phase 4-6)

- Tasks 13-20: No changes needed

---

## Key Benefits

1. **Simpler Architecture**

   - No frameId tracking/complexity
   - No chrome.webNavigation polling
   - Standard executeScript with allFrames

2. **More Reliable**

   - 6 headers stripped (vs 2)
   - Google special handling
   - allFrames handles dynamic iframes

3. **Production-Proven**

   - Based on working reference
   - Handles edge cases
   - Better compatibility

4. **Keeps Our Architecture**
   - Configuration in TypeScript
   - Existing messaging system
   - Existing component structure

---

## Migration Steps

1. Update `headerStripper.ts` with 6-header rules
2. Test POC page with new rules
3. Simplify IframeManager (remove frameId logic)
4. Update ScriptInjector with allFrames
5. Update MessageHandler
6. Add message listener to main page
7. Wire up ControlPanel
8. Test full flow

---

## Notes

- **No content scripts needed** - executeScript with allFrames works!
- **No static JSON** - keep configuration in TypeScript
- **No frameId tracking** - allFrames does it automatically
- **Simpler than reference** - we don't need their complexity
