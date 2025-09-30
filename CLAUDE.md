# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome extension (Manifest V3) that broadcasts prompts to multiple AI chat sites simultaneously. Built with WXT framework, Svelte 5, TypeScript, and Tailwind CSS. The extension uses a side panel UI with robust tab management and real-time state synchronization.

## Essential Commands

```bash
# Development
pnpm dev                  # Start dev mode with hot reload
pnpm dev:firefox          # Start dev mode for Firefox

# Building
pnpm build                # Production build for Chrome
pnpm build:firefox        # Production build for Firefox
pnpm build:test           # Build with test configuration

# Testing
pnpm test                 # Run all tests (unit + e2e)
pnpm test:unit            # Run unit tests only (Vitest)
pnpm e2e                  # Run e2e tests (Playwright)
pnpm e2e:ui               # Run e2e tests with Playwright UI
pnpm test:coverage        # Run tests with coverage report

# Quality checks
pnpm check                # Complete pipeline: type-check + lint + test + build
pnpm type-check           # TypeScript compilation check
pnpm lint                 # ESLint with auto-fix

# Loading extension in Chrome
# 1. Run `pnpm build` to create the dist/ folder
# 2. Open Chrome → chrome://extensions/
# 3. Enable "Developer mode"
# 4. Click "Load unpacked" → select the dist/ folder
```

## Architecture Overview

### Communication Flow

**Background Service Worker ↔ Side Panel**
- Background (`src/entrypoints/background.ts`): Manages tabs, routes messages, handles Chrome API interactions
- Side Panel (`src/entrypoints/sidepanel/`): Svelte 5 UI for user interactions
- Communication: Type-safe message passing via `@webext-core/messaging` (see `src/shared/messaging.ts`)

**Message Broadcasting Flow**
1. User types message in side panel → sends to background via `SEND_MESSAGE`
2. Background's `MessageHandler` coordinates tab launching and message injection
3. `TabManager` launches all enabled site tabs concurrently
4. `ScriptInjector` uses `executeScript` to inject message into each site's input field
5. Each site processes independently with retry logic for DOM readiness

### Key Architecture Patterns

**No Content Scripts**
- All DOM interaction uses dynamic `executeScript` injection (no persistent content scripts)
- Injection logic modularized in `src/background/injections/`
- Each site has specific selectors and injection methods

**Site Configuration System**
- Single source: `src/background/siteConfigs.ts`
- Each site config includes:
  - `inputSelectors`: CSS selectors for input fields
  - `submitSelectors`: CSS selectors for submit buttons
  - `chatUriPatterns`: URL patterns to identify chat context (e.g., `/c/*`, `/chat/*`)
  - `injectionMethod`: Optional custom injection method
  - `colors`: Theme colors for UI
- Custom site ordering via drag-and-drop with persistent storage
- Host permissions auto-generated from site URLs

**Tab Management**
- `TabManager` (`src/background/tabManager.ts`): Core tab operations
  - Concurrent tab launching (no sequential delays)
  - Chat context detection via `chatUriPatterns`
  - Tab readiness checking with retry logic (up to 15 retries, 1s intervals)
  - Smart focus management (focuses first AI tab if current tab is not an AI site)
- Tab state tracked in real-time and synced to side panel

**State Management**
- Background: Chrome storage API for persistent user preferences (site enabled state, custom ordering)
- Side Panel: Svelte 5 stores in `src/entrypoints/sidepanel/stores/`
  - `siteStore.ts`: Site configurations and ordering
  - `messageStore.ts`: Message composition state
  - `themeStore.ts`: Theme preferences (light/dark/auto)
  - `tabStateStore.ts`: Real-time tab state from background
  - `toastStore.ts`: Toast notifications
  - `tabOperationsStore.ts`: Tab operation actions
- Synchronization: Background broadcasts `TAB_EVENT` messages for real-time updates

**Chat Context Detection**
- Each site defines `chatUriPatterns` to identify valid chat URLs
- Example: ChatGPT uses `['/', '/c/*']` to match root and conversation URLs
- `TabManager.isTabInChatContext()` validates if a tab URL matches site patterns
- Prevents false positives from non-chat pages (e.g., settings, landing pages)

### Directory Structure

```
src/
├── entrypoints/
│   ├── background.ts              # Background service worker entry
│   └── sidepanel/                 # Svelte 5 side panel UI
│       ├── main.ts                # Side panel entry point
│       ├── App.svelte             # Root component
│       ├── stores/                # Svelte stores for state management
│       └── components/            # UI components
├── background/
│   ├── background.ts              # Main background coordinator (BackgroundSite class)
│   ├── messageHandler.ts          # Message routing and injection coordination
│   ├── tabManager.ts              # Tab lifecycle, focus, readiness, chat context
│   ├── siteManager.ts             # Site enable/disable, ordering, storage
│   ├── scriptInjector.ts          # ExecuteScript injection with retry logic
│   ├── siteConfigs.ts             # Single source for all site configurations
│   ├── injections/                # Modular injection logic
│   │   ├── index.ts               # Injection exports
│   │   ├── messageInjector.ts     # Core message injection function
│   │   ├── batchController.ts     # Batch injection coordination
│   │   └── readinessChecker.ts    # DOM readiness validation
│   └── utils/
│       └── errorHandling.ts       # Error handling utilities
├── shared/
│   ├── messaging.ts               # Type-safe messaging protocol (webext-core)
│   ├── siteUrls.ts                # Auto-generated host permissions
│   ├── constants.ts               # Shared constants
│   ├── logger.ts                  # Logging utilities
│   ├── focusUtils.ts              # Focus management utilities
│   └── utils.ts                   # Shared helper functions
├── types/
│   ├── siteConfig.ts              # SiteConfig, EnhancedSite types
│   ├── messages.ts                # Message type definitions
│   ├── core.ts                    # Core types (TabInfo, SiteStatusType)
│   ├── storage.ts                 # Storage-related types
│   └── ui.ts                      # UI-specific types
└── __test__/
    └── units/                     # Unit tests (Vitest)
tests/
└── e2e/                           # E2E tests (Playwright)
    ├── extension.spec.ts          # Extension functionality tests
    ├── sidepanel.spec.ts          # Side panel UI tests
    ├── server.ts                  # Test server for mock AI sites
    └── pages/                     # Static test pages
```

## Development Guidelines

### Adding a New AI Site

1. Add site config to `src/background/siteConfigs.ts`:
   - Define `inputSelectors`, `submitSelectors`, `chatUriPatterns`
   - Set default `enabled` state and theme colors
   - Optional: Add `stopSelectors` for stop button detection
   - Optional: Specify `injectionMethod` if custom injection needed

2. Host permissions auto-generate from `url` field via `src/shared/siteUrls.ts`

3. Test injection:
   - Unit test in `src/__test__/units/`
   - E2E test in `tests/e2e/`

### Modifying Tab Management Logic

- Core logic in `src/background/tabManager.ts`
- Key methods:
  - `launchAllTabs()`: Concurrent tab launching
  - `waitForTabReady()`: Readiness checking with retry
  - `isTabInChatContext()`: Chat context validation
  - `focusFirstTabIfNeeded()`: Smart focus management
- Always maintain chat context filtering via `chatUriPatterns`
- Reference unit tests in `src/__test__/units/tabManager.test.ts`

### Working with Message Injection

- Primary files:
  - `src/background/messageHandler.ts`: Orchestrates the entire flow
  - `src/background/scriptInjector.ts`: Handles executeScript with retry
  - `src/background/injections/messageInjector.ts`: Core injection logic
- Injection flow:
  1. Get ordered enabled sites from `SiteManager`
  2. Launch all tabs concurrently
  3. Process each tab independently (wait for ready → inject)
  4. Return aggregated results
- Each injection has 15 retry attempts with 1s intervals
- Tab context validated before each injection attempt

### Testing Requirements

**Unit Tests (Vitest)**
- Test all stores: `src/entrypoints/sidepanel/stores/*.test.ts`
- Test background modules: `src/__test__/units/*.test.ts`
- Use `@webext-core/fake-browser` for Chrome API mocking
- Coverage thresholds: 70% (branches, functions, lines, statements)

**E2E Tests (Playwright)**
- Extension functionality: `tests/e2e/extension.spec.ts`
- Side panel UI: `tests/e2e/sidepanel.spec.ts`
- Mock server: `tests/e2e/server.ts` serves static test pages
- Test with `pnpm e2e` or `pnpm e2e:ui` for interactive debugging

**Always run `pnpm check` before committing** to ensure all quality checks pass.

### Site Ordering System

- Users can drag-and-drop sites to reorder in side panel
- Order persisted in Chrome storage via `SiteManager.setSiteOrder()`
- Batch operations respect custom order via `SiteManager.getOrderedEnabledSites()`
- Utilities in `src/entrypoints/sidepanel/stores/siteStore.ts`

### Message Protocol

All messages defined in `src/shared/messaging.ts` with strict TypeScript types:

```typescript
// Examples:
SEND_MESSAGE(data: SendMessagePayload): void
SITE_TOGGLE(data: SiteTogglePayload): void
GET_SITE_CONFIGS(): { data: { configs: Record<string, SiteConfig> } }
TAB_EVENT(data: TabEventPayload): void  // Background → Side panel
```

Use `sendMessage()` and `onMessage()` from `src/shared/messaging.ts` for all communication.

## Common Tasks

### Running a Single Test
```bash
pnpm test:unit src/__test__/units/siteStore.test.ts
```

### Running E2E Tests with UI
```bash
pnpm e2e:ui  # Opens Playwright UI for debugging
```

### Building for Firefox
```bash
pnpm build:firefox
```

### Checking Coverage
```bash
pnpm test:coverage  # Generates HTML report in coverage/
```

## Build Configuration

- **WXT Config**: `wxt.config.ts` - Main configuration
- **WXT Test Config**: `wxt.config.test.ts` - Test build configuration
- **TypeScript**: `tsconfig.json`
- **Vitest**: `vitest.config.ts` - Unit test configuration
- **Playwright**: `playwright.config.ts` - E2E test configuration
- **ESLint**: `eslint.config.js`
- **Tailwind**: `tailwind.config.js`
- **Svelte**: `svelte.config.js`

## Important Notes

- **No `any` types**: Strict TypeScript mode enabled
- **No persistent content scripts**: All DOM interaction via executeScript
- **Chat context filtering**: Always validate URLs against `chatUriPatterns`
- **Concurrent tab launching**: Use `launchAllTabs()` for zero sequential delays
- **Independent tab processing**: Each tab waits for its own readiness
- **Error handling**: All Chrome API calls wrapped with try/catch
- **Retry logic**: Message injection and tab readiness use retry with exponential backoff