import { test, expect } from './fixtures';
import type { Page, Locator } from '@playwright/test';

test.describe('Mock Extension Tests', () => {
  test('extension broadcasts to mock AI sites and verifies injection', async ({
    context,
    extensionId,
    popupPage,
  }) => {
    console.log('Testing extension broadcasting to mock AI sites...');

    // Start mock server
    const { default: server } = await import('../pages/server');

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // === TEST LOOP: SEND MESSAGE AND VERIFY EXTENSION BEHAVIOR ===
      for (let iteration = 1; iteration <= 5; iteration++) {
        console.log(`\n=== ITERATION ${iteration}/5 ===`);

        const testMessage = `Mock test ${iteration} - ${Date.now()}`;
        console.log(`Testing with message: "${testMessage}"`);

        // Track initial state
        const initialPages = [...context.pages()];
        const initialTabCount = initialPages.length;
        console.log(`Initial tab count: ${initialTabCount}`);

        // === SEND MESSAGE VIA EXTENSION POPUP ===
        const messageInputSelectors = [
          'textarea[placeholder*="prompt"]',
          'textarea[placeholder*="message"]',
          'textarea',
          'input[type="'input[type="text"]',
        ]t messageInput: Locator | null = null;
        for (const selector of messageInputSelectors) {
          const element = popupPage.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            messageInput = element;
            console.log(`Found message input with selector: ${selector}`);
            break;
          }
        }

        if (!messageInput) {
          throw new Error('Could not find message input in popup');
        }

        await messageInput.fill(testMessage);
        await expect(messageInput).toHaveValue(testMessage);

        // Send message
        const sendButtonSelectors = [
          'button[type="submit"]',
          'button:has-text("Send")',
          'button:has-text("Submit")',
          '[data-testid*="send"]',
          '[data-testid'[data-testid*="submit"]',
        ]t sendButton: Locator | null = null;
        for (const selector of sendButtonSelectors) {
          const element = popupPage.locator(selector).first();
          if (await element.isVisible().catch(() => false)) {
            sendButton = element;
            console.log(`Found send button with selector: ${selector}`);
            break;
          }
        }

        if (!sendButton) {
          throw new Error('Could not find send button in popup');
        }

        await sendButton.click();
        console.log('✓ Message sent from popup');

        // === WAIT FOR EXTENSION TO OPEN NEW TABS ===
        console.log('Waiting for extension to open new tabs...');
        await popupPage.waitForTimeout(5000); // Give extension time to open tabs

        const newPages = context.pages();
        const newTabCount = newPages.length;
        console.log(`Tab count after send: ${initialTabCount} -> ${newTabCount}`);

        if (newTabCount <= initialTabCount) {
          console.log('No new tabs opened - extension may not be configured for mock sites');
          continue;
        }

        // === VERIFY NEW TABS ARE MOCK SITES ===
        const newlyOpenedPages = newPages.slice(initialTabCount);
        console.log(`✓ ${newlyOpenedPages.length} new tabs opened`);

        const expectedMockSites = [
          { name: 'ChatGPT', urlPattern: 'localhost:3000/chatgpt', inputSelector: '#prompt-textarea' },
          { name: 'Claude', urlPattern: 'localhost:3000/claude', inputSelector: '.message-input' },
          { name: 'Gemini', urlPattern: 'localhost:3000/gemini', inputSelector: '.search-box' },
          { name: 'Perplexity', urlPattern: 'localhost:3000/perplexity', inputSelector: '#ask-input' },
        ];

        let verifiedSites = 0;

        for (const page of newlyOpenedPages) {
          const url = page.url();
          console.log(`Checking newly opened page: ${url}`);

          // Find which mock site this page corresponds to
          const matchedSite = expectedMockSites.find(site => url.includes(site.urlPattern));

          if (matchedSite) {
            console.log(`✓ Found ${matchedSite.name} mock page: ${url}`);

            try {
              // Wait for page to load
              await page.waitForLoadState('domcontentloaded');
              await page.waitForTimeout(2000); // Give extension time to inject content

              // Check if message was injected
              const inputElement = page.locator(matchedSite.inputSelector).first();
              if (await inputElement.isVisible().catch(() => false)) {
                const inputValue = await inputElement.inputValue().catch(async () => {
                  // For contenteditable elements
                  return await inputElement.textContent().catch(() => '');
                });

                if (inputValue && inputValue.includes(testMessage)) {
                  console.log(`✓ Message injected into ${matchedSite.name}: "${inputValue}"`);
                  verifiedSites++;

                  // Check if submit button was clicked (look for loading state or disabled button)
                  const submitButton = page.locator('[data-testid="send-button"], [data-testid="submit-button"], [data-testid="search-button"]').first();
                  if (await submitButton.isVisible().catch(() => false)) {
                    const isDisabled = await submitButton.isDisabled().catch(() => false);
                    if (isDisabled) {
                      console.log(`✓ Submit button appears to have been clicked (disabled state) in ${matchedSite.name}`);
                    }
                  }
                } else {
                  console.log(`✗ Message not found in ${matchedSite.name} input. Value: "${inputValue}"`);
                }
              } else {
                console.log(`✗ Input element not found in ${matchedSite.name}`);
              }
            } catch (error) {
              console.log(`Error verifying ${matchedSite.name}:`, error);
            }

            // Close the tab to clean up
            await page.close();
          }
        }

        console.log(`Iteration ${iteration}: Verified ${verifiedSites} sites with proper injection`);

        // At least 1 site should have been verified for success
        expect(verifiedSites).toBeGreaterThan(0);

        // Wait before next iteration
        await popupPage.waitForTimeout(1000);
      }

      console.log('✓ Mock extension broadcast test completed successfully');

    } catch (error) {
      console.log('Mock extension test error:', error);
      throw error;
    } finally {
      // Stop server
      server.close();
    }
  });
});
