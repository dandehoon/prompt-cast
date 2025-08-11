# Playwright Chrome Extensions Testing

Source: https://playwright.dev/docs/chrome-extensions

## Overview

Playwright provides comprehensive support for testing Chrome extensions, including both Manifest v2 and v3 extensions.

## Important Notes

- Extensions only work in Chrome/Chromium launched with a persistent context
- Use custom browser args at your own risk
- Use `chromium` channel for headless extension testing

## Basic Setup

### Loading Extension in Tests

```javascript
const { chromium } = require('playwright');

(async () => {
  const pathToExtension = require('path').join(__dirname, 'my-extension');
  const userDataDir = '/tmp/test-user-data-dir';
  
  const browserContext = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`
    ]
  });
  
  // For Manifest v3 - get service worker
  let [serviceWorker] = browserContext.serviceWorkers();
  if (!serviceWorker)
    serviceWorker = await browserContext.waitForEvent('serviceworker');
  
  // Test the service worker as you would any other worker
  await browserContext.close();
})();
```

## Test Fixtures

Create reusable fixtures for extension testing:

```typescript
// fixtures.ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, 'my-extension');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  
  extensionId: async ({ context }, use) => {
    // For Manifest v3:
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker)
      serviceWorker = await context.waitForEvent('serviceworker');
    
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;
```

## Using Fixtures in Tests

```typescript
import { test, expect } from './fixtures';

test('example test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page.locator('body')).toHaveText('Changed by my-extension');
});

test('popup page', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.locator('body')).toHaveText('my-extension popup');
});
```

## Key Browser Arguments

- `--disable-extensions-except=${pathToExtension}` - Only load specified extension
- `--load-extension=${pathToExtension}` - Load extension from path
- `--user-data-dir=${userDataDir}` - Specify user data directory

## Service Worker Testing

For Manifest v3 extensions:

```typescript
// Get service worker
let [serviceWorker] = context.serviceWorkers();
if (!serviceWorker) {
  serviceWorker = await context.waitForEvent('serviceworker');
}

// Extract extension ID from service worker URL
const extensionId = serviceWorker.url().split('/')[2];

// Test service worker functionality
await serviceWorker.evaluate(() => {
  // Your service worker test code
});
```

## Content Script Testing

Test content scripts by navigating to pages where they're injected:

```typescript
test('content script functionality', async ({ page, extensionId }) => {
  await page.goto('https://example.com');
  
  // Wait for content script to load and modify the page
  await expect(page.locator('.extension-added-element')).toBeVisible();
  
  // Test content script functionality
  const result = await page.evaluate(() => {
    return window.myExtensionAPI.someFunction();
  });
  
  expect(result).toBe('expected value');
});
```

## Popup Testing

Test extension popup:

```typescript
test('popup functionality', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  
  // Test popup UI
  await expect(page.getByRole('button', { name: 'Click me' })).toBeVisible();
  await page.getByRole('button', { name: 'Click me' }).click();
  
  // Verify popup behavior
  await expect(page.locator('.result')).toHaveText('Button clicked!');
});
```

## Options Page Testing

Test extension options/settings page:

```typescript
test('options page', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  
  // Test options page functionality
  await page.fill('#setting-input', 'new value');
  await page.click('#save-button');
  
  await expect(page.locator('.save-success')).toBeVisible();
});
```

## Best Practices

1. **Use Persistent Context**: Required for extension loading
2. **Headless Mode**: Use `chromium` channel for headless testing
3. **Cleanup**: Always close context after tests
4. **Extension ID**: Extract from service worker URL for dynamic access
5. **Wait for Service Worker**: May not be immediately available
6. **Proper Args**: Use both `--disable-extensions-except` and `--load-extension`
7. **Test All Components**: Service worker, content scripts, popup, options pages
