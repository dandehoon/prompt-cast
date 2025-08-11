import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process?.env?.CI);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.spec.{js,ts}'], // Run playwright spec files only
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
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
  webServer: {
    command: 'pnpm build', // Ensure extension is built before E2E tests
    timeout: 30000,
    reuseExistingServer: !isCI,
  },
});
