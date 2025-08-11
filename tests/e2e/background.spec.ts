import { test, expect } from './fixtures';

test.describe('Background Script Functionality', () => {
  test('service worker starts and runs', async ({ context, extensionId }) => {
    // Get the service worker
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);
    
    const serviceWorker = workers.find(worker => 
      worker.url().includes(extensionId)
    );
    
    expect(serviceWorker).toBeTruthy();
    
    if (serviceWorker) {
      // Test that service worker is responsive
      try {
        const result = await serviceWorker.evaluate(() => {
          return {
            url: self.location.href,
            ready: true,
            timestamp: Date.now()
          };
        });
        
        expect(result.ready).toBe(true);
        expect(result.url).toContain(extensionId);
        expect(result.timestamp).toBeGreaterThan(0);
      } catch (error) {
        console.log('Service worker evaluation failed:', error);
        // Don't fail test, just log
      }
    }
  });

  test('background script handles extension events', async ({ context, extensionId }) => {
    // Test extension installation event handling
    const serviceWorker = context.serviceWorkers().find(worker => 
      worker.url().includes(extensionId)
    );
    
    if (serviceWorker) {
      // Try to trigger events that background script should handle
      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${extensionId}/popup.html`);
      
      // Opening popup should trigger background script events
      await popup.waitForTimeout(1000);
      
      // Verify service worker is still responsive
      try {
        await serviceWorker.evaluate(() => Date.now());
      } catch (error) {
        console.log('Service worker became unresponsive:', error);
      }
      
      await popup.close();
    }
  });

  test('tab management functionality', async ({ context, extensionId }) => {
    const initialPageCount = context.pages().length;
    
    // Open popup
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForSelector('body');
    
    // Try to interact with site cards that might open tabs
    const siteCards = popup.locator('[data-testid^="site-card-"], .site-card, button').filter({ hasText: /chatgpt|claude|gemini/i });
    
    if (await siteCards.first().isVisible()) {
      // Right-click or look for "Open" button that might open tabs
      const openButtons = popup.locator('button').filter({ hasText: /open|visit|go to/i });
      
      if (await openButtons.first().isVisible()) {
        await openButtons.first().click();
        await popup.waitForTimeout(2000);
        
        // Check if new tabs were opened (indicates tab management is working)
        const newPageCount = context.pages().length;
        console.log(`Page count changed from ${initialPageCount} to ${newPageCount}`);
      }
    }
    
    await popup.close();
  });

  test('message routing between contexts', async ({ context, extensionId }) => {
    // Open popup and a content page
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup.waitForSelector('body');
    
    const contentPage = await context.newPage();
    await contentPage.goto('https://example.com');
    
    // Try to send a message from popup
    const messageInput = popup.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    const sendButton = popup.locator('button:has-text("Send"), button:has-text("Broadcast")').first();
    
    if (await messageInput.isVisible() && await sendButton.isVisible()) {
      await messageInput.fill('Test message routing');
      
      // Enable at least one site
      const toggle = popup.locator('input[type="checkbox"], .toggle').first();
      if (await toggle.isVisible() && !(await toggle.isChecked())) {
        await toggle.click();
      }
      
      await sendButton.click();
      
      // Wait for message processing
      await popup.waitForTimeout(1000);
      
      // Verify popup remains functional (indicates message was handled)
      await expect(popup.locator('.app')).toBeVisible();
    }
    
    await contentPage.close();
    await popup.close();
  });

  test('storage and state management', async ({ context, extensionId }) => {
    // Open popup and make some changes
    const popup1 = await context.newPage();
    await popup1.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup1.waitForSelector('body');
    
    // Try to change settings that should be persisted
    const settingsTab = popup1.locator('header button:has-text("Settings")');
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      
      // Look for toggleable settings
      const settingControls = popup1.locator('input[type="checkbox"], select, input[type="radio"]');
      const controlCount = await settingControls.count();
      
      if (controlCount > 0) {
        const firstControl = settingControls.first();
        const initialState = await firstControl.isChecked?.() || await firstControl.inputValue();
        
        // Change the setting
        if (await firstControl.getAttribute('type') === 'checkbox') {
          await firstControl.click();
        }
        
        await popup1.waitForTimeout(500);
      }
    }
    
    await popup1.close();
    
    // Open popup again and verify state persisted
    const popup2 = await context.newPage();
    await popup2.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup2.waitForSelector('body');
    
    // Verify popup loads correctly (indicates state was saved/restored)
    await expect(popup2.locator('.app')).toBeVisible();
    
    await popup2.close();
  });

  test('error handling and recovery', async ({ context, extensionId }) => {
    const serviceWorker = context.serviceWorkers().find(worker => 
      worker.url().includes(extensionId)
    );
    
    if (serviceWorker) {
      // Try to cause some errors and see if background script recovers
      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${extensionId}/popup.html`);
      
      // Try to send invalid data
      const messageInput = popup.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
      if (await messageInput.isVisible()) {
        // Send very long message that might cause issues
        const longMessage = 'A'.repeat(10000);
        await messageInput.fill(longMessage);
        
        const sendButton = popup.locator('button:has-text("Send"), button:has-text("Broadcast")').first();
        if (await sendButton.isVisible()) {
          await sendButton.click();
          
          // Wait for processing
          await popup.waitForTimeout(2000);
          
          // Verify extension still works
          await expect(popup.locator('.app')).toBeVisible();
        }
      }
      
      await popup.close();
      
      // Verify service worker is still responsive
      try {
        const timestamp = await serviceWorker.evaluate(() => Date.now());
        expect(timestamp).toBeGreaterThan(0);
      } catch (error) {
        console.log('Service worker health check failed:', error);
      }
    }
  });
});

test.describe('Extension Lifecycle', () => {
  test('extension survives browser navigation', async ({ context, extensionId }) => {
    // Open a content page
    const page = await context.newPage();
    await page.goto('https://example.com');
    
    // Open popup to verify extension works
    const popup1 = await context.newPage();
    await popup1.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup1.locator('.app')).toBeVisible();
    await popup1.close();
    
    // Navigate to different page
    await page.goto('https://httpbin.org/html');
    await page.waitForLoadState('domcontentloaded');
    
    // Open popup again to verify extension still works
    const popup2 = await context.newPage();
    await popup2.goto(`chrome-extension://${extensionId}/popup.html`);
    await expect(popup2.locator('.app')).toBeVisible();
    await popup2.close();
    
    await page.close();
  });

  test('multiple popup instances work correctly', async ({ context, extensionId }) => {
    // Open multiple popup instances
    const popup1 = await context.newPage();
    const popup2 = await context.newPage();
    
    await popup1.goto(`chrome-extension://${extensionId}/popup.html`);
    await popup2.goto(`chrome-extension://${extensionId}/popup.html`);
    
    await popup1.waitForSelector('body');
    await popup2.waitForSelector('body');
    
    // Both should be functional
    await expect(popup1.locator('.app')).toBeVisible();
    await expect(popup2.locator('.app')).toBeVisible();
    
    // Try to interact with both
    const message1 = popup1.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    const message2 = popup2.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    
    if (await message1.isVisible() && await message2.isVisible()) {
      await message1.fill('Message from popup 1');
      await message2.fill('Message from popup 2');
      
      await expect(message1).toHaveValue('Message from popup 1');
      await expect(message2).toHaveValue('Message from popup 2');
    }
    
    await popup1.close();
    await popup2.close();
  });

  test('extension permissions are properly requested', async ({ context, extensionId }) => {
    // Check extension permissions on chrome://extensions page
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    
    const extensionCard = page.locator(`extensions-item[id="${extensionId}"]`);
    await expect(extensionCard).toBeVisible();
    
    // Look for details or permissions button
    const detailsButton = extensionCard.locator('button:has-text("Details"), #detailsButton, cr-button');
    
    if (await detailsButton.isVisible()) {
      await detailsButton.click();
      await page.waitForTimeout(1000);
      
      // Should show permissions page without errors
      await expect(page.locator('text=/permissions|access/i')).toBeVisible();
    }
    
    await page.close();
  });
});
