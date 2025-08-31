import { test, expect } from './fixtures';
import { TestUtils } from './test-utils';

test.describe('Side Panel UI Component Tests', () => {
  test('should render basic UI components correctly', async ({
    sidePanelPage,
  }) => {
    // Test basic UI components render correctly
    await TestUtils.verifyBasicUIComponents(sidePanelPage);

    // Check for message input elements (single page layout)
    const messageLabel = sidePanelPage.locator('label[for=message-input]');
    await expect(messageLabel).toHaveText('Prompt');

    const messageTextarea = sidePanelPage.locator('#message-input');
    await expect(messageTextarea).toHaveAttribute(
      'placeholder',
      'Enter your prompt...',
    );

    const sendButton = sidePanelPage.locator('#send-message-button');
    await expect(sendButton).toBeDisabled(); // Should be disabled when no message

    // Check Compose components are visible by default
    const sitesSection = sidePanelPage.locator('#sites-section');
    await expect(sitesSection).toBeVisible();

    const closeAllButton = sidePanelPage.locator('#close-all-tabs-button');
    await expect(closeAllButton).toBeVisible();
  });

  test('should render all sections in single page layout', async ({
    sidePanelPage,
  }) => {
    // In single page layout, all sections should be visible at once

    // Check Sites section is visible (theme is now part of sites section)
    await expect(sidePanelPage.locator('#sites-section')).toBeVisible();

    // Check theme buttons are visible in sites header
    await expect(sidePanelPage.locator('.theme-selector .theme-btn')).toHaveCount(3);

    // Check Message section is visible
    await expect(sidePanelPage.locator('#message-input')).toBeVisible();

    // All sections should be visible simultaneously
    await expect(sidePanelPage.locator('#sites-section')).toBeVisible();
    await expect(sidePanelPage.locator('#message-input')).toBeVisible();
  });

  test('should handle message input interactions', async ({
    sidePanelPage,
  }) => {
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
    // Site toggles are now inline - no need to switch tabs

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

  test('should handle theme selector interactions', async ({
    sidePanelPage,
  }) => {
    // Theme selector is now buttons in the sites section header

    // Find theme selector buttons
    const themeButtons = sidePanelPage.locator('.theme-selector .theme-btn');
    await expect(themeButtons).toHaveCount(3);

    // Test clicking different theme buttons
    // Get the buttons (should be auto, light, dark in that order based on themeOptions)
    const autoButton = themeButtons.nth(0);
    const lightButton = themeButtons.nth(1);
    const darkButton = themeButtons.nth(2);

    // Click light theme button
    await lightButton.click();
    await expect(lightButton).toHaveClass(/active/);

    // Click dark theme button  
    await darkButton.click();
    await expect(darkButton).toHaveClass(/active/);

    // Click auto theme button
    await autoButton.click();
    await expect(autoButton).toHaveClass(/active/);
  });

  test('should persist settings between sessions', async ({
    context,
    extensionId,
  }) => {
    // Open popup page
    let sidePanelPage = await context.newPage();
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/sidepanel.html`,
    );
    await TestUtils.waitForPopupReady(sidePanelPage);

    // Find and change a site setting if available (inline now)
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
    const themeSelect = sidePanelPage.locator('#theme-select');
    if (await themeSelect.isVisible()) {
      await themeSelect.selectOption('dark');
    }

    // Close popup
    await sidePanelPage.close();

    // Wait for settings to persist
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Reopen popup
    sidePanelPage = await context.newPage();
    await sidePanelPage.goto(
      `chrome-extension://${extensionId}/sidepanel.html`,
    );
    await TestUtils.waitForPopupReady(sidePanelPage);

    // Verify settings persisted (inline layout now)
    if (labelCount > 0 && changedState !== null) {
      const firstCheckboxNew = sidePanelPage
        .locator('input[id^="site-checkbox-"]')
        .first();
      await expect(firstCheckboxNew).toBeChecked({ checked: changedState });
    }

    await sidePanelPage.close();
  });
});
