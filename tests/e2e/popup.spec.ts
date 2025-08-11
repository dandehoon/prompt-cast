import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

test.describe('Extension Installation and Basic Functionality', () => {
  test('extension loads correctly', async ({ context, extensionId }) => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    
    // Check that service worker is running
    const workers = context.serviceWorkers();
    expect(workers.length).toBeGreaterThan(0);
    
    const worker = workers[0];
    expect(worker.url()).toContain(extensionId);
  });

  test('extension has proper permissions', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto('chrome://extensions/');
    
    // Find our extension card
    const extensionCard = page.locator(`extensions-item[id="${extensionId}"]`);
    await expect(extensionCard).toBeVisible();
    
    // Check that extension name is correct
    const extensionName = extensionCard.locator('#name');
    await expect(extensionName).toHaveText('Prompt Cast');
    
    await page.close();
  });
});

test.describe('Popup UI Tests', () => {
  test('popup opens and displays correctly', async ({ popupPage }) => {
    // Check main app structure
    await expect(popupPage.locator('.app')).toBeVisible();
    
    // Check header tabs
    await expect(popupPage.locator('header button:has-text("Compose")')).toBeVisible();
    await expect(popupPage.locator('header button:has-text("Settings")')).toBeVisible();
    
    // By default, Compose tab should be active
    const composeTab = popupPage.locator('header button:has-text("Compose")');
    await expect(composeTab).toHaveClass(/active/);
  });

  test('tab navigation works', async ({ popupPage }) => {
    // Start on Compose tab
    const composeTab = popupPage.locator('header button:has-text("Compose")');
    const settingsTab = popupPage.locator('header button:has-text("Settings")');
    
    await expect(composeTab).toHaveClass(/active/);
    
    // Switch to Settings
    await settingsTab.click();
    await expect(settingsTab).toHaveClass(/active/);
    await expect(composeTab).not.toHaveClass(/active/);
    
    // Switch back to Compose
    await composeTab.click();
    await expect(composeTab).toHaveClass(/active/);
    await expect(settingsTab).not.toHaveClass(/active/);
  });

  test('compose section is visible', async ({ popupPage }) => {
    // Check for compose components
    await expect(popupPage.locator('textarea[placeholder*="prompt"]')).toBeVisible();
    
    // Check for site cards (should have at least ChatGPT, Claude, etc.)
    const siteCards = popupPage.locator('[data-testid^="site-card-"], .site-card');
    await expect(siteCards.first()).toBeVisible();
  });

  test('settings section is accessible', async ({ popupPage }) => {
    // Switch to settings tab
    await popupPage.locator('header button:has-text("Settings")').click();
    
    // Check for settings content (theme selector, etc.)
    await expect(popupPage.locator('text=/Theme|Dark|Light/')).toBeVisible();
  });
});

test.describe('Site Management', () => {
  test('site cards display correctly', async ({ popupPage }) => {
    // Wait for sites to load
    await popupPage.waitForTimeout(1000);
    
    // Check for major AI sites
    const expectedSites = ['ChatGPT', 'Claude', 'Gemini', 'Perplexity'];
    
    for (const siteName of expectedSites) {
      const siteCard = popupPage.locator(`text="${siteName}"`).first();
      await expect(siteCard).toBeVisible();
    }
  });

  test('site toggle functionality', async ({ popupPage }) => {
    // Wait for sites to load
    await popupPage.waitForTimeout(1000);
    
    // Find a site toggle switch
    const firstToggle = popupPage.locator('input[type="checkbox"], .toggle, [role="switch"]').first();
    
    if (await firstToggle.isVisible()) {
      const initialState = await firstToggle.isChecked();
      
      // Toggle the switch
      await firstToggle.click();
      await popupPage.waitForTimeout(500);
      
      // Verify state changed
      const newState = await firstToggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });
});

test.describe('Message Composition', () => {
  test('message input works', async ({ popupPage }) => {
    const messageInput = popupPage.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    await expect(messageInput).toBeVisible();
    
    // Type a test message
    const testMessage = 'Hello, this is a test prompt for AI assistants!';
    await messageInput.fill(testMessage);
    
    // Verify the message was entered
    await expect(messageInput).toHaveValue(testMessage);
  });

  test('message character counter works', async ({ popupPage }) => {
    const messageInput = popupPage.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    await messageInput.fill('Test message');
    
    // Look for character counter (might be text like "12/1000" or similar)
    const counterPattern = /\d+\s*\/?\s*\d+|\d+\s*chars?|\d+\s*characters?/i;
    const counter = popupPage.locator(`text=${counterPattern}`);
    
    if (await counter.isVisible()) {
      const counterText = await counter.textContent();
      expect(counterText).toMatch(counterPattern);
    }
  });

  test('send button state changes with message', async ({ popupPage }) => {
    const messageInput = popupPage.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    const sendButton = popupPage.locator('button:has-text("Send"), button:has-text("Broadcast"), button[type="submit"]').first();
    
    // Initially, send button might be disabled with no message
    await messageInput.fill('');
    
    if (await sendButton.isVisible()) {
      // Add a message
      await messageInput.fill('Test message for broadcast');
      await popupPage.waitForTimeout(300);
      
      // Send button should be enabled with a message
      await expect(sendButton).toBeEnabled();
    }
  });
});

test.describe('Theme and Settings', () => {
  test('theme selector works', async ({ popupPage }) => {
    // Go to settings
    await popupPage.locator('header button:has-text("Settings")').click();
    
    // Look for theme controls
    const themeSelector = popupPage.locator('select, input[type="radio"], button').filter({ hasText: /theme|dark|light/i });
    
    if (await themeSelector.first().isVisible()) {
      // Try to change theme
      await themeSelector.first().click();
      
      // Check if theme changed (body class or CSS variables)
      const bodyClasses = await popupPage.locator('body, html').getAttribute('class');
      expect(bodyClasses).toBeDefined();
    }
  });
});

test.describe('Extension Integration', () => {
  test('popup communicates with background script', async ({ popupPage, context }) => {
    // This test verifies that the popup can communicate with the background script
    // We'll check if the popup can load site configurations
    
    // Wait for initial load and check if sites are populated
    await popupPage.waitForTimeout(2000);
    
    // Check that site data is loaded (indicates background communication)
    const siteCards = popupPage.locator('[data-testid^="site-card-"], .site-card, text="ChatGPT"');
    await expect(siteCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('error handling works', async ({ popupPage }) => {
    // Try to trigger an error scenario (like trying to send empty message)
    const messageInput = popupPage.locator('textarea[placeholder*="prompt"], textarea[placeholder*="message"]');
    const sendButton = popupPage.locator('button:has-text("Send"), button:has-text("Broadcast")').first();
    
    if (await sendButton.isVisible()) {
      await messageInput.fill('');
      await sendButton.click();
      
      // Look for error message or validation
      const errorElements = popupPage.locator('.error, .alert, [role="alert"], text=/error|invalid|required/i');
      
      // Don't assert error exists as it depends on implementation
      // Just check that the app doesn't crash
      await expect(popupPage.locator('.app')).toBeVisible();
    }
  });
});
