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
      channel: 'chromium', // Use chromium for better extension support
      headless: false, // Set to true for CI
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
    // Give extension more time to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let extensionId = '';

    // Method 1: Get from service worker (most reliable for Manifest v3)
    try {
      console.log('Waiting for service worker...');

      // First check if any workers already exist
      let workers = context.serviceWorkers();
      console.log(`Current service workers: ${workers.length}`);

      if (workers.length === 0) {
        // Wait for service worker with reduced timeout
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
          console.log('Found extension ID from service worker:', extensionId);
          break;
        }
      }
    } catch (error) {
      console.log('Could not get extension from service worker:', error);
    }

    // Method 2: Check for existing pages with chrome-extension URLs
    if (!extensionId) {
      console.log('Checking existing pages for extension URLs...');
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        console.log('Page URL:', url);
        if (url.includes('chrome-extension://')) {
          const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
          if (match) {
            extensionId = match[1];
            console.log('Found extension ID from page URL:', extensionId);
            break;
          }
        }
      }
    }

    // Method 3: Try to trigger extension by opening a popup
    if (!extensionId) {
      console.log('Trying to trigger extension by opening new page...');
      try {
        const triggerPage = await context.newPage();
        await triggerPage.goto('https://chatgpt.com');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check for service workers again
        const workers = context.serviceWorkers();
        for (const worker of workers) {
          const url = worker.url();
          const match = url.match(/chrome-extension:\/\/([a-z]{32})/);
          if (match) {
            extensionId = match[1];
            console.log('Found extension ID after page trigger:', extensionId);
            break;
          }
        }

        await triggerPage.close();
      } catch (error) {
        console.log('Error triggering extension:', error);
      }
    }

    if (!extensionId) {
      throw new Error(`Could not find extension ID. Make sure extension is built and loaded.
        Check that the extension exists at: ${path.resolve(
          __dirname,
          '../../.output/chrome-mv3',
        )}
        Run 'pnpm build' to build the extension first.

        Troubleshooting:
        1. Ensure Chrome/Chromium is installed
        2. Check that manifest.json exists in the build output
        3. Verify service worker is properly configured`);
    }

    console.log('Using extension ID:', extensionId);
    await use(extensionId);
  },

  popupPage: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for popup to be fully loaded
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(1000); // Give time for Svelte to initialize

    await use(page);
    await page.close();
  },
});

export const expect = test.expect;
