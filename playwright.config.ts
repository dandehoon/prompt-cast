import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCI = Boolean(process?.env?.CI);

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.spec.{js,ts}'], // Run all spec files
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 0, // No retries for faster failure feedback
  workers: 4, // Multiple workers for parallel execution
  timeout: 60000, // 60 seconds max per consolidated test
  globalSetup: path.resolve(__dirname, './tests/e2e/global-setup.ts'),
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
