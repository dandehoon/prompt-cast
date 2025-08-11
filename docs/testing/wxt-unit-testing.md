# WXT Unit Testing Guide

Source: https://wxt.dev/guide/essentials/unit-testing

## Overview

WXT provides first-class support for Vitest for unit testing Chrome extensions.

## Vitest Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineConfig({
  plugins: [WxtVitest()],
});
```

## WxtVitest Plugin Features

The `WxtVitest()` plugin automatically:

- Polyfills the extension API (`browser`) with an in-memory implementation using [@webext-core/fake-browser](https://webext-core.aklinker1.io/fake-browser/installation)
- Adds all Vite config or plugins from `wxt.config.ts`
- Configures auto-imports (if enabled)
- Applies internal WXT Vite plugins for things like bundling remote code
- Sets up global variables provided by WXT (`import.meta.env.BROWSER`, `import.meta.env.MANIFEST_VERSION`, `import.meta.env.IS_CHROME`, etc)
- Configures aliases (`@/*`, `@@/*`, etc) so imports can be resolved

## Example Tests

### Testing Storage APIs

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';

const accountStorage = storage.defineItem<Account>('local:account');

async function isLoggedIn(): Promise<boolean> {
  const value = await accountStorage.getValue();
  return value != null;
}

describe('isLoggedIn', () => {
  beforeEach(() => {
    // Reset fake browser state between tests
    // See https://webext-core.aklinker1.io/fake-browser/reseting-state
    fakeBrowser.reset();
  });

  it('should return true when the account exists in storage', async () => {
    const account: Account = {
      username: '...',
      preferences: {
        // ...
      },
    };
    await accountStorage.setValue(account);

    expect(await isLoggedIn()).toBe(true);
  });

  it('should return false when the account does not exist in storage', async () => {
    await accountStorage.deleteValue();

    expect(await isLoggedIn()).toBe(false);
  });
});
```

## Mocking WXT APIs

### Understanding #imports

When WXT sees this import:
```typescript
// What you write
import { injectScript, createShadowRootUi } from '#imports';
```

Vitest sees this:
```typescript
import { injectScript } from 'wxt/utils/inject-script';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
```

### Mocking Strategy

To mock `injectScript`, you need to mock the real import path:

```typescript
vi.mock("wxt/utils/inject-script", () => ({
  injectScript: vi.fn()
}))
```

**Tip**: Refer to your project's `.wxt/types/imports-module.d.ts` file to lookup real import paths for `#imports`. If the file doesn't exist, run `wxt prepare`.

## Key Benefits

- **No Manual Mocking**: Don't have to mock `browser.storage` - fake-browser implements storage in-memory
- **Real Extension Behavior**: Tests behave like they would in a real extension
- **Auto-configured**: WXT handles all the complex setup automatically
- **Type Safety**: Full TypeScript support with proper extension API types

## Example Projects

- [aklinker1/github-better-line-counts](https://github.com/aklinker1/github-better-line-counts)
- [wxt-dev/examples's Vitest Example](https://github.com/wxt-dev/examples/tree/main/examples/vitest-unit-testing)

## Other Testing Frameworks

While possible to use other frameworks, you'll need to manually:
- Disable auto-imports
- Setup import aliases
- Mock extension APIs
- Setup test environment for WXT features

Refer to [WXT's Vitest plugin source](https://github.com/wxt-dev/wxt/blob/main/packages/wxt/src/testing/wxt-vitest-plugin.ts) for implementation details.
