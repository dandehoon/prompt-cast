import { test, expect } from './fixtures';
import { TestUtils } from './test-utils';

test.describe('Side Panel UI Component Tests', () => {
  test('should render basic UI components correctly', async ({ sidePanelPage }) => {
    // Test basic UI components render correctly
    await TestUtils.verifyBasicUIComponents(sidePanelPage);

    // Check for core compose tab elements
    const composeButton = sidePanelPage.locator('#tab-home');
    await expect(composeButton).toHaveClass(/active/);

    const messageLabel = sidePanelPage.locator('label[for=message-input]');
    await expect(messageLabel).toHaveText('Prompt');

    const messageTextarea = sidePanelPage.locator('#message-input');
    await expect(messageTextarea).toHaveAttribute(
      'placeholder',
      'Ask anything',
    );

    const sendButton = sidePanelPage.locator('#send-message-button');
    await expect(sendButton).toBeDisabled(); // Should be disabled when no message

    // Check Compose components are visible by default
    const sitesSection = sidePanelPage.locator('#sites-section');
    await expect(sitesSection).toBeVisible();

    const closeAllButton = sidePanelPage.locator('#close-all-tabs-button');
    await expect(closeAllButton).toBeVisible();
  });

  test('should toggle between tabs correctly', async ({ sidePanelPage }) => {
    // Initially on Compose tab
    const composeButton = sidePanelPage.locator('#tab-home');
    const settingsButton = sidePanelPage.locator('#tab-settings');

    await expect(composeButton).toHaveClass(/active/);

    // Check Compose content is visible
    await expect(sidePanelPage.locator('#sites-section')).toBeVisible();
    await expect(sidePanelPage.locator('#message-input')).toBeVisible();

    // Switch to Settings tab
    await TestUtils.switchToTab(sidePanelPage, 'tab-settings');

    // Check Settings content is visible
    await expect(
      sidePanelPage.locator('section').filter({ hasText: 'Sites' }).first(),
    ).toBeVisible();
    await expect(sidePanelPage.locator('#theme-settings')).toBeVisible();

    // Check Compose content is hidden
    await expect(sidePanelPage.locator('#message-input')).not.toBeVisible();

    // Switch back to Compose tab
    await TestUtils.switchToTab(sidePanelPage, 'tab-home');

    // Check Compose content is visible again
    await expect(sidePanelPage.locator('#message-input')).toBeVisible();
  });

  test('should handle message input interactions', async ({ sidePanelPage }) => {
    const messageTextarea = sidePanelPage.locator('#message-input');
    const sendButton = sidePanelPage.locator('#send-message-button');

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

  test('should handle site toggles in settings', async ({ sidePanelPage }) => {
    await TestUtils.switchToTab(sidePanelPage, 'tab-settings');

    // Find site toggle labels
    const siteLabels = sidePanelPage.locator('label[id^="site-toggle-"]');
    const labelCount = await siteLabels.count();

    if (labelCount > 0) {
      // Test toggling the first site
      const firstCheckbox = sidePanelPage
        .locator('input[id^="site-checkbox-"]')
        .first();
      const isInitiallyChecked = await firstCheckbox.isChecked();

      // Use utility to toggle
      await TestUtils.toggleSite(sidePanelPage, 0, !isInitiallyChecked);

      // Toggle back
      await TestUtils.toggleSite(sidePanelPage, 0, isInitiallyChecked);
    }
  });

  test('should handle theme selector interactions', async ({ sidePanelPage }) => {
    await TestUtils.switchToTab(sidePanelPage, 'tab-settings');

    // Find theme selector section
    const themeSection = sidePanelPage.locator('#theme-settings');
    await expect(themeSection).toBeVisible();

    // Find theme option buttons
    const themeButtons = themeSection.locator('button[id^="theme-option-"]');
    const buttonCount = await themeButtons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Test clicking different theme buttons
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      await TestUtils.selectTheme(sidePanelPage, i);
      const themeButton = themeButtons.nth(i);
      await expect(themeButton).toBeVisible();
    }
  });

  test('should persist settings between sessions', async ({
    context,
    extensionId,
  }) => {
    // Open popup page
    let sidePanelPage = await context.newPage();
    await sidePanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await TestUtils.waitForPopupReady(sidePanelPage);

    // Find and change a site setting if available
    await TestUtils.switchToTab(sidePanelPage, 'tab-settings');
    const siteLabels = sidePanelPage.locator('label[id^="site-toggle-"]');
    const labelCount = await siteLabels.count();

    let changedState: boolean | null = null;

    if (labelCount > 0) {
      const firstCheckbox = sidePanelPage
        .locator('input[id^="site-checkbox-"]')
        .first();
      const isInitiallyChecked = await firstCheckbox.isChecked();

      // Toggle the setting
      await TestUtils.toggleSite(sidePanelPage, 0, !isInitiallyChecked);
      changedState = !isInitiallyChecked;
    }

    // Change theme if available
    const themeButtons = sidePanelPage.locator('button[id^="theme-option-"]');
    const themeButtonCount = await themeButtons.count();
    if (themeButtonCount > 1) {
      await TestUtils.selectTheme(sidePanelPage, 1);
    }

    // Close popup
    await sidePanelPage.close();

    // Wait for settings to persist
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reopen popup
    sidePanelPage = await context.newPage();
    await sidePanelPage.goto(`chrome-extension://${extensionId}/sidepanel.html`);
    await TestUtils.waitForPopupReady(sidePanelPage);

    // Verify settings persisted
    if (labelCount > 0 && changedState !== null) {
      await TestUtils.switchToTab(sidePanelPage, 'tab-settings');
      const firstCheckboxNew = sidePanelPage
        .locator('input[id^="site-checkbox-"]')
        .first();
      await expect(firstCheckboxNew).toBeChecked({ checked: changedState });
    }

    await sidePanelPage.close();
  });
});
