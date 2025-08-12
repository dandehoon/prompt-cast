import { test, expect } from './fixtures';
import { TestUtils } from './test-utils';

test.describe('Popup UI Component Tests', () => {
  test('should render basic UI components correctly', async ({ popupPage }) => {
    // Verify all essential UI components are present
    await TestUtils.verifyBasicUIComponents(popupPage);

    // Check specific component details
    const composeButton = popupPage.locator('#tab-home');
    await expect(composeButton).toHaveClass(/active/);

    const messageLabel = popupPage.locator('label[for=message-input]');
    await expect(messageLabel).toHaveText('Prompt');

    const messageTextarea = popupPage.locator('#message-input');
    await expect(messageTextarea).toHaveAttribute('placeholder', 'Ask anything');

    const sendButton = popupPage.locator('#send-message-button');
    await expect(sendButton).toBeDisabled(); // Should be disabled when no message

    // Check Compose components are visible by default
    const sitesSection = popupPage.locator('#sites-section');
    await expect(sitesSection).toBeVisible();

    const closeAllButton = popupPage.locator('#close-all-tabs-button');
    await expect(closeAllButton).toBeVisible();
  });

  test('should toggle between tabs correctly', async ({ popupPage }) => {
    // Initially on Compose tab
    const composeButton = popupPage.locator('#tab-home');
    const settingsButton = popupPage.locator('#tab-settings');

    await expect(composeButton).toHaveClass(/active/);

    // Check Compose content is visible
    await expect(popupPage.locator('#sites-section')).toBeVisible();
    await expect(popupPage.locator('#message-input')).toBeVisible();

    // Switch to Settings tab
    await TestUtils.switchToTab(popupPage, 'tab-settings');

    // Check Settings content is visible
    await expect(popupPage.locator('section').filter({ hasText: 'Sites' }).first()).toBeVisible();
    await expect(popupPage.locator('#theme-settings')).toBeVisible();

    // Check Compose content is hidden
    await expect(popupPage.locator('#message-input')).not.toBeVisible();

    // Switch back to Compose tab
    await TestUtils.switchToTab(popupPage, 'tab-home');

    // Check Compose content is visible again
    await expect(popupPage.locator('#message-input')).toBeVisible();
  });

  test('should handle message input interactions', async ({ popupPage }) => {
    const messageTextarea = popupPage.locator('#message-input');
    const sendButton = popupPage.locator('#send-message-button');

    // Initially send button should be disabled
    await expect(sendButton).toBeDisabled();

    // Type a message
    const testMessage = 'Test message for UI validation';
    await messageTextarea.fill(testMessage);

    // Send button should now be enabled
    await expect(sendButton).toBeEnabled();

    // Verify message content
    await expect(messageTextarea).toHaveValue(testMessage);

    // Clear the message
    await messageTextarea.fill('');

    // Send button should be disabled again
    await expect(sendButton).toBeDisabled();
  });

  test('should handle site toggles in settings', async ({ popupPage }) => {
    await TestUtils.switchToTab(popupPage, 'tab-settings');

    // Find site toggle labels
    const siteLabels = popupPage.locator('label[id^="site-toggle-"]');
    const labelCount = await siteLabels.count();

    if (labelCount > 0) {
      // Test toggling the first site
      const firstCheckbox = popupPage.locator('input[id^="site-checkbox-"]').first();
      const isInitiallyChecked = await firstCheckbox.isChecked();

      // Use utility to toggle
      await TestUtils.toggleSite(popupPage, 0, !isInitiallyChecked);

      // Toggle back
      await TestUtils.toggleSite(popupPage, 0, isInitiallyChecked);
    }
  });

  test('should handle theme selector interactions', async ({ popupPage }) => {
    await TestUtils.switchToTab(popupPage, 'tab-settings');

    // Find theme selector section
    const themeSection = popupPage.locator('#theme-settings');
    await expect(themeSection).toBeVisible();

    // Find theme option buttons
    const themeButtons = themeSection.locator('button[id^="theme-option-"]');
    const buttonCount = await themeButtons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Test clicking different theme buttons
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      await TestUtils.selectTheme(popupPage, i);
      const themeButton = themeButtons.nth(i);
      await expect(themeButton).toBeVisible();
    }
  });

  test('should persist settings between sessions', async ({ context, extensionId }) => {
    // Open popup page
    let popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await TestUtils.waitForPopupReady(popupPage);

    // Find and change a site setting if available
    await TestUtils.switchToTab(popupPage, 'tab-settings');
    const siteLabels = popupPage.locator('label[id^="site-toggle-"]');
    const labelCount = await siteLabels.count();
    
    let changedState: boolean | null = null;
    
    if (labelCount > 0) {
      const firstCheckbox = popupPage.locator('input[id^="site-checkbox-"]').first();
      const isInitiallyChecked = await firstCheckbox.isChecked();
      
      // Toggle the setting
      await TestUtils.toggleSite(popupPage, 0, !isInitiallyChecked);
      changedState = !isInitiallyChecked;
    }

    // Change theme if available
    const themeButtons = popupPage.locator('button[id^="theme-option-"]');
    const themeButtonCount = await themeButtons.count();
    if (themeButtonCount > 1) {
      await TestUtils.selectTheme(popupPage, 1);
    }

    // Close popup
    await popupPage.close();

    // Wait for settings to persist
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reopen popup
    popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await TestUtils.waitForPopupReady(popupPage);

    // Verify settings persisted
    if (labelCount > 0 && changedState !== null) {
      await TestUtils.switchToTab(popupPage, 'tab-settings');
      const firstCheckboxNew = popupPage.locator('input[id^="site-checkbox-"]').first();
      await expect(firstCheckboxNew).toBeChecked({ checked: changedState });
    }

    await popupPage.close();
  });
});
