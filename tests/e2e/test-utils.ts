import { Page, expect } from '@playwright/test';

/**
 * Common test utilities to reduce duplication across E2E tests
 */

export class TestUtils {
  /**
   * Navigate to a specific tab in the popup
   */
  static async switchToTab(page: Page, tabId: 'tab-home' | 'tab-settings') {
    const tabButton = page.locator(`#${tabId}`);
    await tabButton.click();
    await expect(tabButton).toHaveClass(/active/);
  }

  /**
   * Enable or disable a site toggle in settings
   */
  static async toggleSite(page: Page, siteIndex: number, enabled: boolean) {
    // Ensure we're on settings tab
    await this.switchToTab(page, 'tab-settings');
    
    const siteLabel = page.locator('label[id^="site-toggle-"]').nth(siteIndex);
    const siteCheckbox = page.locator('input[id^="site-checkbox-"]').nth(siteIndex);
    
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
    await this.switchToTab(page, 'tab-settings');
    
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
   * Send a message through the popup interface
   */
  static async sendMessage(page: Page, message: string) {
    // Ensure we're on compose tab
    await this.switchToTab(page, 'tab-home');
    
    const messageTextarea = page.locator('#message-input');
    const sendButton = page.locator('#send-message-button');
    
    await messageTextarea.fill(message);
    await expect(sendButton).toBeEnabled();
    await sendButton.click();
  }

  /**
   * Wait for popup to be fully loaded and ready
   */
  static async waitForPopupReady(page: Page) {
    await page.waitForSelector('body', { state: 'visible' });
    await page.waitForTimeout(1000); // Allow Svelte to initialize
  }

  /**
   * Get count of enabled sites from the compose tab
   */
  static async getEnabledSiteCount(page: Page): Promise<number> {
    await this.switchToTab(page, 'tab-home');
    
    const sitesSection = page.locator('#sites-section');
    const siteCards = sitesSection.locator('.pc-card');
    return await siteCards.count();
  }

  /**
   * Select a theme option in settings
   */
  static async selectTheme(page: Page, themeIndex: number) {
    await this.switchToTab(page, 'tab-settings');
    
    const themeSection = page.locator('#theme-settings');
    const themeButtons = themeSection.locator('button[id^="theme-option-"]');
    
    await themeButtons.nth(themeIndex).click();
  }

  /**
   * Clean up any opened tabs (excluding the original popup)
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
    // Header with tabs
    const tabButtons = page.locator('header button[id^="tab-"]');
    await expect(tabButtons).toHaveCount(2);
    
    // Message input components
    const messageLabel = page.locator('label[for=message-input]');
    await expect(messageLabel).toBeVisible();
    
    const messageTextarea = page.locator('#message-input');
    await expect(messageTextarea).toBeVisible();
    
    const sendButton = page.locator('#send-message-button');
    await expect(sendButton).toBeVisible();
    
    // Status indicator
    const statusSection = page.locator('footer .flex.items-center.justify-center');
    await expect(statusSection).toBeVisible();
  }
}
