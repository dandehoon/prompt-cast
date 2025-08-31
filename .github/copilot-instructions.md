# AI Agent Instructions for Prompt Cast Chrome Extension

## Project Overview

Chrome extension (Manifest V3) with Svelte 5 side panel UI (via WXT), multi-s### Development Workflow

1. **Setup**: `pnpm install`
2. **Development**: `pnpm dev`
3. **Load extension**: Chrome → Extensions → "Load unpacked" → select `dist` folder
4. **Testing**: `pnpm test`
5. **Quality check**: `pnpm check` (before commits)
6. **Production build**: `pnpm build`essaging, robust tab management, and state synchronization across background/sidepanel contexts. All build, test, and quality workflows are unified under pnpm scripts.

## Architecture & Data Flow

**Communication Pattern:**

- **Background Service Worker**: Tab/site management, message routing, persistent state, dynamic injection
- **Side Panel Svelte App**: User interface, site toggles, message composition (Svelte 5, WXT)

**Message Flow:**

1. User types in side panel → Background script → executeScript injection (broadcast to enabled sites)
2. Site configuration changes → Background storage → Side panel state sync
3. Tab events → Background tab manager → Side panel status updates

## Repository Structure

```
src/
├── entrypoints/
│   ├── background.ts         # Background entry (service worker)
│   └── sidepanel/            # Svelte side panel UI, stores, main.ts
├── background/
│   ├── background.ts         # Main background logic
│   ├── tabManager.ts         # Tab focus, readiness, retry logic
│   ├── siteConfigs.ts        # Site config single source
│   ├── siteManager.ts        # Site enable/disable, state
│   ├── scriptInjector.ts     # Injection engine
│   ├── injections/           # Modular per-site injection logic
│   └── utils/                # Background utilities
├── shared/
│   ├── messaging.ts          # Type-safe protocol wrapper
│   ├── siteUrls.ts           # Auto-generated host/match patterns
│   ├── constants.ts          # Message types, enums
│   ├── logger.ts             # Logging utilities
│   ├── focusUtils.ts         # Enhanced focus management
│   └── utils.ts              # Shared helpers
├── types/
│   ├── messages.ts           # Discriminated unions for messaging
│   ├── siteConfig.ts         # Site config types
│   ├── core.ts               # Core extension types
│   └── ui.ts                 # UI types
├── entrypoints/sidepanel/stores/
│   ├── siteStore.ts          # Site state (enabled, config)
│   ├── messageStore.ts       # Message state
│   ├── themeStore.ts         # Theme state
│   ├── tabOperationsStore.ts # Tab operations state
│   └── toastStore.ts         # Toast notifications
tests/
│   ├── e2e/                  # E2E infra, server utility, Playwright
│   └── pages/                # Static test pages for E2E
scripts/
│   ├── update-changelog.sh   # Version bump changelog updates
│   └── generate-commit-log.sh # Release commit logs
```

## Essential Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Dev mode with hot reload
pnpm build                # Production build
pnpm check                # Complete pipeline: type-check + lint + test + build
pnpm test                 # Run all tests (Vitest, unified)
pnpm test:coverage        # Run tests with coverage
```

## Critical Architecture Patterns

### Site Configuration System

- **Single Source**: `src/background/siteConfigs.ts` contains all site configs
- **Auto-generation**: Host permissions auto-generated from site URLs via `src/shared/siteUrls.ts`
- **Site-Specific Selectors**: Each site has `inputSelectors`/`submitSelectors` arrays
- **Injection Methods**: Each site specifies injection method (form, execCommand, etc.)

### Chrome Extension Communication

- **Centralized Messaging**: `src/shared/messaging.ts` provides type-safe wrapper via `@webext-core/messaging`
- **Type-Safe Messages**: All messages defined in `src/types/messages.ts` (discriminated unions)
- **Error Handling**: All Chrome API calls wrapped with robust try/catch and error reporting
- **Retry Logic**: Tab/message flows use retry and exponential backoff

### Injection Strategy

- **Dynamic Injection**: All DOM interaction uses Chrome's executeScript (no persistent content scripts)
- **Readiness Checking**: executeScript-based readiness check with retry logic for slow sites
- **Graceful Degradation**: Continues operation even if some sites fail; robust error reporting
- **Multiple Injection Engines**: Modular injection logic per site in `src/background/injections/`

### State Management

- **Background**: Chrome storage API for persistent user/site state
- **Side Panel**: Svelte stores in `src/entrypoints/sidepanel/stores/` with derived stores and localStorage
- **Synchronization**: Side panel and background sync via message passing; stores auto-refresh
- **Theme Management**: Svelte store (`themeStore.ts`) with system/auto detection
- **Focus Management**: Enhanced focus utilities (`focusUtils.ts`) for keyboard navigation
- **Tab Operations**: Dedicated store (`tabOperationsStore.ts`) for tab management actions

## Testing Architecture

**Unified Vitest Control**

- All testing via Vitest commands (no external scripts)
- Automatic lifecycle management (setup/teardown via test hooks)
- Extension building controlled via Vitest `beforeAll` hooks

**Test Types**

- **Unit Tests**: `src/**/*.test.ts` - Vitest with WXT's `fakeBrowser` APIs
- **E2E Infrastructure**: `tests/e2e/setup-integration.test.ts` - Extension build validation
- **E2E Side Panel**: `tests/e2e/sidepanel.spec.ts` - Side panel UI and functionality testing
- **E2E Server**: `tests/e2e/server.ts` for static test pages

## Build Process

**WXT Framework** handles bundling:

- **Entry Points**: Background, sidepanel builds
- **Asset Processing**: Tailwind CSS compilation + static asset copying
- **Watch Mode**: Real-time rebuild with hot reload
- **Output**: `dist/` folder ready for Chrome extension loading

## Code Quality Standards

### Mandatory Quality Pipeline

**CRITICAL**: Every code change MUST pass:

```bash
pnpm check
```

This runs: TypeScript compilation, ESLint, full test suite, production build.

### TypeScript

- Strict mode enabled, no `any` types, full type coverage required

### Testing Requirements

- Unit tests for all Svelte stores and modules
- E2E/infrastructure tests for extension build and startup
- Chrome API mocking via `@webext-core/fake-browser`

### Changelog Management

- Always maintain `[Unreleased]` section at top of CHANGELOG.md (without date)
- Add new features/fixes under `[Unreleased]` section
- Format: `## [Unreleased]` (not `## [Unreleased] - 2025-XX-XX`)
- Release process converts to versioned entry automatically

## Development Workflow

1. **Setup**: `pnpm install`
2. **Development**: `pnpm dev`
3. **Load extension**: Chrome → Extensions → "Load unpacked" → select `dist` folder
4. **Testing**: `pnpm test`
5. **Quality check**: `pnpm check` (before commits)
6. **Production build**: `pnpm build`

## File Naming Conventions

- Components: PascalCase (`PopupApp.svelte`)
- Stores: camelCase (`siteStore.ts`)
- Types: PascalCase (`SiteConfig.ts`)
- Tests: Same as source + `.test.` (`PopupApp.test.ts`)
- Configs: kebab-case (`site-config.ts`)

## AI Agent Quick Reference

- **Injection**: Always via executeScript - see `src/background/injections/`
- **Site configs**: Single source in `src/background/siteConfigs.ts`
- **Tab management**: `src/background/tabManager.ts` handles focus, readiness, retry
- **Side Panel state**: Svelte stores in `src/entrypoints/sidepanel/stores/`
- **Messaging**: All background/sidepanel comms via `src/shared/messaging.ts`
- **Testing**: Unified under Vitest (`pnpm test`)
- **Build/quality**: Always use `pnpm check` before commit
- **No content scripts**: All references are legacy and should be removed

**Key files:**

- `src/background/siteConfigs.ts`: Site config single source
- `src/shared/messaging.ts`: Messaging protocol
- `src/entrypoints/sidepanel/stores/`: Svelte stores for UI state
- `tests/e2e/server.ts`: E2E server utility
