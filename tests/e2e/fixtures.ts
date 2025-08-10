import { test as base, chromium, type BrowserContext } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    // Use development build path which should exist after running `pnpm dev`
    const pathToExtension = path.join(
      __dirname,
      '../../.output/chrome-mv3-dev',
    );
    const context = await chromium.launchPersistentContext('', {
      channel: 'chrome',
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--disable-web-security',
        '--no-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Alternative approach: parse the extension ID from chrome://extensions
    const page = await context.newPage();
    await page.goto('chrome://extensions');

    // Enable Developer mode to see extension IDs
    const devModeToggle = page.locator('#devMode');
    await devModeToggle.click();

    // Wait for extensions to load and look for our extension
    await page.waitForTimeout(2000);

    // Look for our extension by name
    const extensionCards = page.locator('extensions-item');
    let extensionId = '';

    const count = await extensionCards.count();
    for (let i = 0; i < count; i++) {
      const card = extensionCards.nth(i);
      const name = await card.locator('#name').textContent();
      if (name && name.includes('Prompt Cast')) {
        extensionId = (await card.getAttribute('id')) || '';
        break;
      }
    }

    await page.close();

    if (!extensionId) {
      throw new Error('Could not find Prompt Cast extension ID');
    }

    await use(extensionId);
  },
});

export const expect = test.expect;
