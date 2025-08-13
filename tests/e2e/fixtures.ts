import {
  test as base,
  chromium,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isCI = Boolean(process?.env?.CI);

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
  popupPage: Page;
}>({
  context: async ({}, use) => {
    // Use the test extension build path
    const pathToExtension = path.resolve(__dirname, '../../.output/chrome-mv3');

    console.log('Loading extension from:', pathToExtension);

    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: isCI,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--disable-web-security',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      ],
    });

    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    // Give extension time to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let extensionId = '';

    // Primary method: Get from service worker
    try {
      console.log('Looking for extension service worker...');

      let workers = context.serviceWorkers();
      console.log(`Found ${workers.length} existing service workers`);

      if (workers.length === 0) {
        console.log('Waiting for service worker to start...');
        const worker = await context.waitForEvent('serviceworker', {
          timeout: 10000,
        });
        workers = [worker];
      }

      for (const worker of workers) {
        const url = worker.url();
        console.log('Service worker URL:', url);
        const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
        if (match) {
          extensionId = match[1];
          console.log('✓ Extension ID found:', extensionId);
          break;
        }
      }
    } catch (error) {
      console.log('Service worker method failed:', error.message);
    }

    // Fallback method: Check existing pages
    if (!extensionId) {
      console.log('Checking existing pages for extension URLs...');
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.includes('chrome-extension://')) {
          const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
          if (match) {
            extensionId = match[1];
            console.log('✓ Extension ID found from page:', extensionId);
            break;
          }
        }
      }
    }

    // Final fallback: Trigger extension loading
    if (!extensionId) {
      console.log('Triggering extension by opening test page...');
      try {
        const triggerPage = await context.newPage();
        await triggerPage.goto('https://claude.ai');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const workers = context.serviceWorkers();
        for (const worker of workers) {
          const url = worker.url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
          if (match) {
            extensionId = match[1];
            console.log('✓ Extension ID found after trigger:', extensionId);
            break;
          }
        }

        await triggerPage.close();
      } catch (error) {
        console.log('Trigger method failed:', error.message);
      }
    }

    if (!extensionId) {
      const buildPath = path.resolve(__dirname, '../../.output/chrome-mv3');
      throw new Error(`Could not find extension ID.
        Build path: ${buildPath}

        Troubleshooting:
        1. Run 'pnpm build' to build the extension
        2. Ensure Chrome/Chromium is installed
        3. Check that manifest.json exists in build output`);
    }

    console.log('Using extension ID:', extensionId);
    await use(extensionId);
  },

  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for popup to be ready
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow Svelte to initialize

    await use(page);
    await page.close();
  },
});

export const expect = test.expect;
