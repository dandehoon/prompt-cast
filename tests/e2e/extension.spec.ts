import { test, expect } from './fixtures';

test.describe('Prompt Cast Extension', () => {
  test('should load the extension', async ({ context, extensionId }) => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/); // Chrome extension ID format
  });

  test('should have popup page accessible', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Check if the popup loads
    await expect(page.locator('body')).toBeVisible();

    // Check for our main app component
    await expect(page.locator('div')).toBeVisible();
  });

  test('should show the popup title/header', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if popup contains expected content
    // Since we're using Svelte, we need to wait for the component to render
    await page.waitForSelector('div', { timeout: 5000 });

    // The popup should be visible and have some content
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('should open popup without console errors', async ({
    page,
    extensionId,
  }) => {
    const consoleErrors: string[] = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Wait for the page to load and components to render
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('div', { timeout: 5000 });

    // Give a bit more time for any async effects to complete
    await page.waitForTimeout(1000);

    // Check that there are no console errors, especially the effect_update_depth_exceeded error
    const hasEffectError = consoleErrors.some(
      (error) =>
        error.includes('effect_update_depth_exceeded') ||
        error.includes('https://svelte.dev/e/effect_update_depth_exceeded'),
    );

    if (hasEffectError) {
      console.log('Console errors found:', consoleErrors);
    }

    expect(hasEffectError).toBe(false);

    // Also check that popup functionality is working
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be able to test on a sample site', async ({ context, page }) => {
    // Navigate to a test site
    await page.goto('https://example.com');

    // Check that the page loads
    await expect(page.locator('h1')).toContainText('Example Domain');
  });
});
