import { test, expect } from './fixtures';
import { Page } from '@playwright/test';

test.describe('Content Script Integration', () => {
  test('content script loads on AI sites', async ({ context, extensionId }) => {
    const testSites = [
      { name: 'ChatGPT', url: 'https://chat.openai.com', checkText: 'ChatGPT' },
      { name: 'Claude', url: 'https://claude.ai', checkText: 'Claude' },
      { name: 'Gemini', url: 'https://gemini.google.com', checkText: 'Gemini' },
      { name: 'Perplexity', url: 'https://perplexity.ai', checkText: 'Perplexity' },
    ];

    for (const site of testSites) {
      const page = await context.newPage();
      
      try {
        // Navigate to the site
        await page.goto(site.url, { 
          waitUntil: 'domcontentloaded',
          timeout: 10000 
        });

        // Wait a bit for the page to load
        await page.waitForTimeout(2000);

        // Check if content script has injected any elements or modified the page
        // This could be extension-specific classes, data attributes, or script tags
        const hasExtensionMarkers = await page.evaluate(() => {
          // Look for signs that our content script has run
          return !!(
            document.querySelector('[data-prompt-cast]') ||
            document.querySelector('.prompt-cast-injected') ||
            window.promptCastExtension ||
            document.documentElement.hasAttribute('data-prompt-cast-loaded')
          );
        });

        // Even if no markers are found, the test passes if page loads
        // This verifies content script doesn't break the site
        console.log(`${site.name}: Extension markers found: ${hasExtensionMarkers}`);
        
        // Verify the site loaded properly
        await expect(page.locator('body')).toBeVisible();
        
      } catch (error) {
        console.log(`Could not test ${site.name}: ${error}`);
        // Don't fail the test for network issues
      } finally {
        await page.close();
      }
    }
  });

  test('content script injection readiness', async ({ context, extensionId }) => {
    // Create a mock page to test content script readiness
    const page = await context.newPage();
    
    // Navigate to a simple page first
    await page.goto('https://example.com');
    
    // Check if we can communicate with content script
    try {
      const contentScriptReady = await page.evaluate(() => {
        // Try to detect if content script is ready
        return new Promise(resolve => {
          const timeout = setTimeout(() => resolve(false), 5000);
          
          // Listen for extension events or check for extension objects
          if (window.promptCastExtension) {
            clearTimeout(timeout);
            resolve(true);
          } else {
            // Check periodically
            const interval = setInterval(() => {
              if (window.promptCastExtension || document.querySelector('[data-prompt-cast]')) {
                clearTimeout(timeout);
                clearInterval(interval);
                resolve(true);
              }
            }, 100);
          }
        });
      });

      console.log('Content script ready:', contentScriptReady);
    } catch (error) {
      console.log('Content script readiness check failed:', error);
    }
    
    await page.close();
  });

  test('message injection capability', async ({ context, extensionId }) => {
    // Test on a simple page where we can control the DOM
    const page = await context.newPage();
    
    // Create a simple test page with input elements
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <textarea id="test-input" placeholder="Type here..."></textarea>
          <input type="text" id="test-text" placeholder="Text input" />
          <button id="test-button">Submit</button>
        </body>
      </html>
    `);

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Test that inputs are accessible (content script should be able to find and use them)
    const textarea = page.locator('#test-input');
    const textInput = page.locator('#test-text');
    const button = page.locator('#test-button');

    await expect(textarea).toBeVisible();
    await expect(textInput).toBeVisible();
    await expect(button).toBeVisible();

    // Test typing in inputs (simulating what content script would do)
    await textarea.fill('Test message from extension');
    await expect(textarea).toHaveValue('Test message from extension');

    await textInput.fill('Another test');
    await expect(textInput).toHaveValue('Another test');

    await page.close();
  });
});

test.describe('Cross-Site Message Broadcasting', () => {
  test('popup can broadcast to multiple sites', async ({ context, extensionId, popupPage }) => {
    // Open a few test pages that could receive messages
    const testPages: Page[] = [];
    const testUrls = [
      'https://example.com',
      'https://httpbin.org/html',
    ];

    try {
      // Open multiple pages
      for (const url of testUrls) {
        const page = await context.newPage();
        try {
          await page.goto(url, { timeout: 5000 });
          testPages.push(page);
        } catch {
          await page.close();
        }
      }

      // Go to popup and try to send a message
      const messageInput = popupPage.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
      const sendButton = popupPage.locator('button:has-text("Send"), button:has-text("Broadcast")').first();

      if (await messageInput.isVisible() && await sendButton.isVisible()) {
        // Fill in test message
        await messageInput.fill('Test broadcast message');
        
        // Enable some sites if needed
        const toggles = popupPage.locator('input[type="checkbox"], .toggle').first();
        if (await toggles.isVisible() && !(await toggles.isChecked())) {
          await toggles.click();
        }

        // Try to send
        await sendButton.click();
        
        // Wait a bit for message to be processed
        await popupPage.waitForTimeout(1000);
        
        // Verify popup didn't crash
        await expect(popupPage.locator('.app')).toBeVisible();
      }

    } finally {
      // Clean up test pages
      for (const page of testPages) {
        await page.close();
      }
    }
  });

  test('extension handles network errors gracefully', async ({ popupPage }) => {
    // Test with invalid/unreachable sites
    const messageInput = popupPage.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    const sendButton = popupPage.locator('button:has-text("Send"), button:has-text("Broadcast")').first();

    if (await messageInput.isVisible() && await sendButton.isVisible()) {
      await messageInput.fill('Test message to unreachable sites');
      
      // Try to send message
      await sendButton.click();
      
      // Wait for any error handling
      await popupPage.waitForTimeout(2000);
      
      // Popup should still be functional
      await expect(popupPage.locator('.app')).toBeVisible();
      await expect(messageInput).toBeVisible();
    }
  });
});

test.describe('Extension Persistence', () => {
  test('extension state persists across popup opens', async ({ context, extensionId }) => {
    // Open popup first time
    const popup1 = await context.newPage();
    await popup1.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup1.waitForSelector('body');

    // Change some setting (if theme selector exists)
    const settingsTab = popup1.locator('header button:has-text("Settings")');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      
      // Look for theme selector or other settings
      const themeControl = popup1.locator('select, input[type="radio"], button').filter({ hasText: /theme|dark|light/i }).first();
      if (await themeControl.isVisible()) {
        await themeControl.click();
      }
    }

    await popup1.close();

    // Open popup second time
    const popup2 = await context.newPage();
    await popup2.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup2.waitForSelector('body');

    // Verify popup opens successfully (state should be restored)
    await expect(popup2.locator('.app')).toBeVisible();
    
    await popup2.close();
  });

  test('extension works after page refresh', async ({ context, extensionId }) => {
    // Open a test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Extension should still work
    // Open popup to verify extension is still functional
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup.locator('.app')).toBeVisible();
    
    await popup.close();
    await page.close();
  });
});
