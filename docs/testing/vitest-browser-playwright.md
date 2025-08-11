# Vitest Browser Mode with Playwright

Source: https://vitest.dev/guide/browser/playwright

## Overview

Vitest browser mode allows running tests in a real browser environment using Playwright as the provider.

## TypeScript Configuration

Add type references for Playwright provider:

```typescript
// vitest.shims.d.ts
/// <reference types="@vitest/browser/providers/playwright" />
```

Or in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["@vitest/browser/providers/playwright"]
  }
}
```

## Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium', // or 'firefox', 'webkit'
          launch: {
            // Playwright launch options
            // Note: headless is controlled by test.browser.headless
          },
          connect: {
            // For connecting to existing Playwright server (3.2.0+)
          },
          context: {
            // Browser context options
            // Note: Vitest sets ignoreHTTPSErrors: true and serviceWorkers: 'allow'
          },
        },
      ],
    },
  },
})
```

## Key Options

### launch
- Directly passed to `playwright[browser].launch`
- Vitest ignores `launch.headless` - use `test.browser.headless` instead
- Debug flags auto-added when `--inspect` is enabled

### connect (3.2.0+)
- Passed to `playwright[browser].connect`
- For connecting to existing Playwright server
- Ignores `launch` options when used

### context
- Passed to `browser.newContext()`
- Context created per test file, not per test
- Vitest auto-sets:
  - `ignoreHTTPSErrors: true`
  - `serviceWorkers: 'allow'` (for MSW support)
- Use `test.browser.viewport` instead of context viewport

### actionTimeout (3.0.0+)
- Default: no timeout (1 second before 3.0.0)
- Configures timeout for accessibility checks and actions
- Can be overridden per-action:

```typescript
import { page, userEvent } from '@vitest/browser/context'

await userEvent.click(page.getByRole('button'), {
  timeout: 1_000,
})
```

## Migration from Vitest 2.x

Before Vitest 3, options were in `providerOptions`:

```typescript
// Old way (deprecated)
export default defineConfig({
  test: {
    browser: {
      providerOptions: {
        launch: {},
        context: {},
      },
    },
  },
})

// New way (Vitest 3+)
export default defineConfig({
  test: {
    browser: {
      instances: [
        {
          browser: 'chromium',
          launch: {},
          context: {},
        },
      ],
    },
  },
})
```

## Best Practices

1. **Use `test.browser.headless`** instead of `launch.headless`
2. **Use `test.browser.viewport`** instead of context viewport
3. **Leverage service worker support** for module mocking with MSW
4. **Configure action timeout** based on your app's responsiveness
5. **One context per test file** - plan tests accordingly
