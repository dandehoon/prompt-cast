/// <reference types="vitest" />
/// <reference types="@vitest/browser/providers/playwright" />
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/__test__/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts}', 
      'tests/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules', 
      '.git', 
      'tests/e2e/**/*.spec.ts', // Exclude Playwright E2E tests from Vitest
      '.output/**/*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__test__/',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.spec.*',
        'tests/**',
        '.output/**',
        'docs/**',
      ],
      include: [
        'src/**/*.{js,ts}',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    browser: {
      enabled: false, // Can be enabled with --browser flag or for specific tests
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
          launch: {
            args: [
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--no-sandbox',
            ],
          },
          context: {
            viewport: { width: 800, height: 600 },
          }
        }
      ],
      headless: true,
    },
  },
});
