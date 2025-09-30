import { Page, expect } from '@playwright/test';

/**
 * Common test utilities to reduce duplication across E2E tests
 */
export class TestUtils {
  /**
   * Enable or disable a site toggle in settings
   */
  /**
   * Navigate to a specific tab in the side panel (DEPRECATED - single page now)
   */
  static async switchToTab(page: Page, tabId: 'tab-home' | 'tab-settings') {
    // No-op since we now have a single page layout
    // Settings are inline, no tab switching needed
    console.warn('switchToTab is deprecated - single page layout now');
  }

  /**
   * Enable or disable a site toggle in settings
   */
  static async toggleSite(page: Page, siteIndex: number, enabled: boolean) {
    // Settings are now inline, no need to switch tabs

    const siteLabel = page.locator('label[id^="site-toggle-"]').nth(siteIndex);
    const siteCheckbox = page
      .locator('input[id^="site-checkbox-"]')
      .nth(siteIndex);

    const isCurrentlyChecked = await siteCheckbox.isChecked();

    if (isCurrentlyChecked !== enabled) {
      await siteLabel.click();
    }

    await expect(siteCheckbox).toBeChecked({ checked: enabled });
  }

  /**
   * Enable at least one site for testing
   */
  static async ensureAtLeastOneSiteEnabled(page: Page) {
    // Settings are now inline, no need to switch tabs

    const siteLabels = page.locator('label[id^="site-toggle-"]');
    const labelCount = await siteLabels.count();

    if (labelCount > 0) {
      const firstCheckbox = page.locator('input[id^="site-checkbox-"]').first();
      if (!(await firstCheckbox.isChecked())) {
        await siteLabels.first().click();
      }
    }
  }

  /**
   * Send a message through the side panel interface
   */
  static async sendMessage(page: Page, message: string) {
    // No need to switch tabs in single page layout

    const messageTextarea = page.locator('#message-input');
    const sendButton = page.locator('#send-message-button');

    await messageTextarea.fill(message);
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
  }

  /**
   * Wait for side panel to be fully loaded and ready
   */
  static async waitForPopupReady(page: Page) {
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow Svelte to initialize
  }

  /**
   * Get the count of enabled sites from site cards
   */
  static async getEnabledSiteCount(page: Page): Promise<number> {
    // Single page layout, no need to switch tabs

    const sitesSection = page.locator('#sites-section');
    const siteCards = sitesSection.locator('.pc-card');
    return await siteCards.count();
  }

  /**
   * Select a theme option in settings
   */
  static async selectTheme(page: Page, themeOption: string) {
    // Settings are now inline with dropdown selector

    const themeSelect = page.locator('#theme-select');
    await themeSelect.selectOption(themeOption);
  }

  /**
   * Clean up any opened tabs (excluding the original side panel)
   */
  static async cleanupTabs(context: any, originalPageCount: number) {
    const allPages = context.pages();
    for (let i = originalPageCount; i < allPages.length; i++) {
      if (allPages[i] && !allPages[i].isClosed()) {
        await allPages[i].close();
      }
    }
  }

  /**
   * Verify that basic UI components are visible
   */
  static async verifyBasicUIComponents(page: Page) {
    // Sites section (now always visible)
    const sitesSection = page.locator('#sites-section');
    await expect(sitesSection).toBeVisible();

    // Message input components
    const messageLabel = page.locator('label[for=message-input]');
    await expect(messageLabel).toBeVisible();

    const messageTextarea = page.locator('#message-input');
    await expect(messageTextarea).toBeVisible();

    const sendButton = page.locator('#send-message-button');
    await expect(sendButton).toBeVisible();

    // Theme button (now a single cycling button in sites section header)
    const themeButton = page.locator('.theme-selector .theme-btn');
    await expect(themeButton).toBeVisible();

    // Site toggles (now inline)
    const siteToggles = page.locator('label[id^="site-toggle-"]');
    const toggleCount = await siteToggles.count();
    expect(toggleCount).toBeGreaterThan(0);

    // Status indicator
    const statusSection = page.locator(
      'footer .flex.items-center.justify-center',
    );
    await expect(statusSection).toBeVisible();
  }
}
