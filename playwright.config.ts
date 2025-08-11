import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process?.env?.CI);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/popup.spec.{js,ts}', '**/extension.spec.{js,ts}'], // Run all E2E tests
  fullyParallel: false, // Single worker for extension testing
  forbidOnly: isCI,
  retries: 0, // No retries for faster failure feedback
  workers: 1, // Single worker to avoid conflicts
  timeout: 60000, // 60 seconds max per consolidated test
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  outputDir: 'test-results/',
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    baseURL: 'chrome-extension://',
    actionTimeout: 15000, // 15 seconds max per action
  },
  projects: [
    {
      name: 'extension-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
