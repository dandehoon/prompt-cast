import { test, expect } from './fixtures';

test.describe('Basic Extension Loading', () => {
  test('extension loads and has valid ID', async ({ context, extensionId }) => {
    // Simple test to verify extension loading works
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
    console.log('Extension loaded successfully with ID:', extensionId);
  });

  test('popup page loads', async ({ popupPage }) => {
    // Simple test to verify popup loads
    await expect(popupPage.locator('body')).toBeVisible();
    console.log('Popup page loaded successfully');
  });
});
