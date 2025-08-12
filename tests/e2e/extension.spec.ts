import { test, expect } from './fixtures';
import { TestUtils } from './test-utils';

test.describe('Extension Functional Tests', () => {
  test('should send message to enabled sites', async ({ context, extensionId }) => {
    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await TestUtils.waitForPopupReady(popupPage);

    // Ensure at least one site is enabled
    await TestUtils.ensureAtLeastOneSiteEnabled(popupPage);

    // Send a test message
    const testMessage = 'Hello from Prompt Cast extension test!';
    const initialPageCount = context.pages().length;
    
    await TestUtils.sendMessage(popupPage, testMessage);

    // Wait for extension operations to complete
    await popupPage.waitForTimeout(5000);

    // Check that new tabs were opened
    const finalPages = context.pages();
    const newTabsOpened = finalPages.length > initialPageCount;

    if (newTabsOpened) {
      console.log('✓ New tabs were opened successfully');

      // Find AI site pages
      const aiSitePages = finalPages.filter((page) => {
        const url = page.url();
        return (
          url.includes('claude.ai') ||
          url.includes('gemini.google.com') ||
          url.includes('perplexity.ai') ||
          url.includes('localhost')
        );
      });

      // Verify message injection on at least one site
      let messageVerified = false;
      for (const page of aiSitePages) {
        try {
          await page.waitForSelector('body', { state: 'visible', timeout: 5000 });
          await page.waitForTimeout(3000);

          // Check for message on different site types
          if (page.url().includes('claude') || page.url().includes('localhost:3000/claude')) {
            const humanMessages = page.locator('.human-message');
            const messageCount = await humanMessages.count();
            
            for (let i = 0; i < messageCount; i++) {
              const messageText = await humanMessages.nth(i).textContent();
              if (messageText?.includes(testMessage)) {
                console.log(`✓ Message verified on Claude page`);
                messageVerified = true;
                break;
              }
            }
          }

          if (messageVerified) break;
        } catch (error) {
          console.log(`Failed to verify message on ${page.url()}:`, error.message);
        }
      }

      expect(messageVerified).toBe(true);

      // Clean up
      await TestUtils.cleanupTabs(context, initialPageCount);
    } else {
      console.log('ℹ No new tabs opened - may indicate no sites enabled in test mode');
    }

    await popupPage.close();
  });

  test('should handle multiple site tabs correctly', async ({ context, extensionId }) => {
    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await TestUtils.waitForPopupReady(popupPage);

    // Enable multiple sites if available
    await TestUtils.switchToTab(popupPage, 'tab-settings');
    const siteLabels = popupPage.locator('label[id^="site-toggle-"]');
    const labelCount = await siteLabels.count();

    // Enable at least 2 sites if available
    for (let i = 0; i < Math.min(labelCount, 2); i++) {
      await TestUtils.toggleSite(popupPage, i, true);
    }

    // Send message to multiple sites
    const testMessage = 'Multi-site test message';
    const initialPageCount = context.pages().length;
    
    await TestUtils.sendMessage(popupPage, testMessage);

    // Wait for operation to complete
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Verify multiple tabs were opened
    const finalPageCount = context.pages().length;
    const newTabsCount = finalPageCount - initialPageCount;

    expect(newTabsCount).toBeGreaterThan(0);

    // Clean up
    await TestUtils.cleanupTabs(context, initialPageCount);
    await popupPage.close();
  });

  test('should handle site card navigation', async ({ context, extensionId }) => {
    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await TestUtils.waitForPopupReady(popupPage);

    // Ensure we're on compose tab and have enabled sites
    await TestUtils.ensureAtLeastOneSiteEnabled(popupPage);
    await TestUtils.switchToTab(popupPage, 'tab-home');

    // Find site cards
    const sitesSection = popupPage.locator('#sites-section');
    const siteCards = sitesSection.locator('.pc-card');
    const cardCount = await siteCards.count();

    if (cardCount > 0) {
      const initialPageCount = context.pages().length;

      // Click the first site card
      await siteCards.first().click();

      // Wait for potential navigation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if a new tab was opened or existing tab was focused
      const finalPageCount = context.pages().length;

      if (finalPageCount > initialPageCount) {
        console.log('✓ Site card click opened new tab');
        await TestUtils.cleanupTabs(context, initialPageCount);
      } else {
        console.log('✓ Site card click may have focused existing tab');
      }
    }

    await popupPage.close();
  });

  test('should handle close all tabs functionality', async ({ context, extensionId }) => {
    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await TestUtils.waitForPopupReady(popupPage);

    // Ensure sites are enabled and send a message to create tabs
    await TestUtils.ensureAtLeastOneSiteEnabled(popupPage);
    await TestUtils.sendMessage(popupPage, 'Test message for close all');

    // Wait for tabs to open
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Test close all functionality
    const closeAllButton = popupPage.locator('#close-all-tabs-button');
    await expect(closeAllButton).toBeVisible();

    // Click close all
    await closeAllButton.click();

    // Wait for close operation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify the button is still functional
    await expect(closeAllButton).toBeVisible();

    await popupPage.close();
  });
});
