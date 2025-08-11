import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
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
    // Use the built extension path
    const pathToExtension = path.resolve(__dirname, '../../.output/chrome-mv3');
    
    console.log('Loading extension from:', pathToExtension);
    
    const context = await chromium.launchPersistentContext('', {
      channel: 'chrome',
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
      ],
    });
    
    await use(context);
    await context.close();
  },
  
  extensionId: async ({ context }, use) => {
    // Wait for extension to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    let extensionId = '';
    
    // Method 1: Get from service worker (most reliable for Manifest v3)
    try {
      let workers = context.serviceWorkers();
      if (workers.length === 0) {
        // Wait for service worker if not immediately available
        console.log('Waiting for service worker...');
        const worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
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

    // Method 2: Check chrome://extensions page as fallback
    if (!extensionId) {
      console.log('Trying chrome://extensions fallback...');
      const page = await context.newPage();
      try {
        await page.goto('chrome://extensions/');
        
        // Enable developer mode if needed
        const devModeToggle = page.locator('extensions-manager').locator('extensions-toolbar').locator('#devMode');
        
        try {
          if (await devModeToggle.isVisible() && !(await devModeToggle.isChecked())) {
            await devModeToggle.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          console.log('Could not toggle dev mode:', e);
        }

        await page.waitForTimeout(3000);
        
        // Find our extension by name
        const extensionCards = page.locator('extensions-item');
        const count = await extensionCards.count();
        console.log(`Found ${count} extension cards`);
        
        for (let i = 0; i < count; i++) {
          try {
            const card = extensionCards.nth(i);
            const name = await card.locator('#name').textContent();
            console.log(`Extension ${i}: ${name}`);
            if (name && name.includes('Prompt Cast')) {
              extensionId = (await card.getAttribute('id')) || '';
              if (extensionId) {
                console.log('Found extension ID from extensions page:', extensionId);
                break;
              }
            }
          } catch (err) {
            console.log(`Error checking extension ${i}:`, err);
            continue;
          }
        }
      } catch (error) {
        console.log('Error accessing extensions page:', error);
      } finally {
        await page.close();
      }
    }

    if (!extensionId) {
      console.log('Extension ID not found, checking for any chrome-extension pages...');
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

    if (!extensionId) {
      throw new Error(`Could not find extension ID. Make sure extension is built and loaded. 
        Check that the extension exists at: ${path.resolve(__dirname, '../../.output/chrome-mv3')}
        Run 'pnpm build' to build the extension first.`);
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
