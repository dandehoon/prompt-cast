# AI Agent Instructions for Prompt Cast Chrome Extension

## Project Overview

Chrome extension (Manifest V3) with Svelte 5 popup UI (via WXT), multi-site AI messaging, robust tab management, and state synchronization across background/popup/content contexts. All build, test, and quality workflows are unified under pnpm scripts—no external scripts required.

## Architecture & Data Flow

**Three-Context Communication Pattern:**

- **Background Service Worker**: Tab/site management, message routing, persistent state, dynamic injection
- **Popup Svelte App**: User interface, site toggles, message composition (Svelte 5, WXT)

**Message Flow:**

1. User types in popup → Background script → executeScript injection (broadcast to enabled sites)
2. Site configuration changes → Background storage → Popup state sync
3. Tab events → Background tab manager → Popup status updates

src/

## Repository Structure & Entrypoints

```
src/
├── entrypoints/         # WXT entry points (background, popup)
├── background/          # Background script modules (injection, tab management)
├── shared/              # Types, utilities, messaging
├── types/               # TypeScript definitions
```

## Essential Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Dev mode with hot reload (alias for watch)
pnpm build                # Production build (includes Tailwind CSS)
pnpm check                # Complete pipeline: type-check + lint + test + build
pnpm type-check           # TypeScript compilation
pnpm lint                 # ESLint check and fix
pnpm test                 # Run all tests (Vitest, unified)
pnpm test:run             # Run all tests once
pnpm test:ui              # Run tests with UI
pnpm test:coverage        # Run tests with coverage
pnpm test:setup           # Run E2E setup integration tests only
pnpm test:e2e:playwright  # (Legacy) Playwright browser tests
```

## Critical Architecture Patterns

### Site Configuration System

- **Single Source of Truth**: `src/background/siteConfigs.ts` contains all site configs
- **Auto-generation**: Host permissions and match patterns are auto-generated from site URLs via `src/shared/siteUrls.ts`
- **Site-Specific Selectors**: Each site has `inputSelectors`/`submitSelectors` arrays for DOM targeting
- **Injection Methods**: Each site can specify injection method (form, execCommand, etc.)

### Chrome Extension Communication & Messaging

- **Centralized Messaging**: `src/shared/messaging.ts` provides a type-safe, protocol-driven wrapper for all background/popup communication (via `@webext-core/messaging`)
- **Type-Safe Messages**: All messages are defined in `src/types/messages.ts` and `src/shared/constants.ts` (discriminated unions)
- **Error Handling**: All Chrome API calls and message handlers are wrapped with robust try/catch and error reporting (see `withErrorHandling` in background)
- **Retry Logic**: Tab/message flows use retry and exponential backoff (see `TabManager.sendMessageWithRetry` and readiness checks)

### Injection Strategy

- **Dynamic Injection**: All DOM interaction uses Chrome's executeScript (no persistent content scripts)
- **Readiness Checking**: executeScript-based readiness check with retry logic for slow-loading sites (e.g., Gemini)
- **Graceful Degradation**: Continues operation even if some sites fail to inject; robust error reporting
- **Multiple Injection Engines**: Modular injection logic (form, execCommand, rich text) per site

### State Management Pattern

- **Background**: Uses Chrome storage API for persistent user/site state
- **Popup**: Svelte stores in `src/entrypoints/popup/stores/` manage all UI state, with derived stores for computed values and localStorage for persistence (see `siteStore.ts`, `messageStore.ts`)
- **Synchronization**: Popup and background sync via message passing; stores auto-refresh on state changes
- **Theme Management**: Theme is managed via Svelte store (`themeStore.ts`), with system/auto detection and localStorage persistence

**Mandatory Quality Pipeline**

**CRITICAL**: Every code change MUST pass the complete verification pipeline:

```bash
pnpm check
```

This runs:

1. TypeScript compilation check
2. ESLint code quality checks
3. Full test suite (Vitest, all types)
4. Production build verification

**Never consider any task complete until `pnpm check` passes without errors.**

---

**v2 Note:**

- Content scripts have been fully removed. All message injection now uses executeScript for improved performance, security, and error reporting.

---

## AI Agent Quick Reference

- **Injection is always via executeScript**: See `src/background/injections/` for modular logic per site.
- **Site configs**: Single source in `src/background/siteConfigs.ts` (selectors, injection method, etc.)
- **Tab management**: `src/background/tabManager.ts` handles tab focus, readiness, and retry logic.
- **Popup state**: Svelte stores in `src/entrypoints/popup/stores/` (see `siteStore.ts`, `messageStore.ts`).
- **Messaging**: All background/popup comms via `src/shared/messaging.ts` (type-safe, protocol-driven).
- **Testing**: Unified under Vitest (`pnpm test`), E2E infra in `tests/e2e/`, test pages in `tests/pages/`.
- **Build/quality**: Always use `pnpm check` before commit (runs type-check, lint, test, build).
- **No content scripts**: If you see references, they're legacy and should be removed.

## Configuration Files

### Build & Tooling

- `esbuild.config.js` - Build configuration (watch/production modes)
- `tailwind.config.js` - CSS utilities and design tokens
- `tsconfig.json` - TypeScript compiler settings
- `eslint.config.js` - Code quality and style rules

### Package Management

- `package.json` - Dependencies and scripts
- `pnpm-lock.yaml` - Dependency lock file
- `pnpm-workspace.yaml` - Workspace configuration

### Chrome Extension

- `src/manifest.json` - Extension manifest v3
- `src/background/config/siteConfig.ts` - Site configurations

## Testing Architecture

**Unified Vitest Control**

- **All testing controlled via Vitest commands** - No external scripts
- **Automatic lifecycle management** - Setup/teardown via test hooks
- **Extension building** - Controlled via Vitest `beforeAll` hooks
- **Server management** - Controlled via Vitest lifecycle
- **Process cleanup** - Automatic via `afterAll` and signal handlers

**Unit Tests**

- **Framework**: Vitest with WXT's testing plugin
- **Environment**: Node.js with WXT's `fakeBrowser`
- **APIs**: In-memory Chrome extension APIs via `@webext-core/fake-browser`
- **Setup**: Automatic via `WxtVitest()` plugin
- **Location**: `src/**/*.test.ts`

**E2E Infrastructure Tests**

- **Framework**: Vitest (same as unit tests)
- **Purpose**: Validates extension building, server startup, file structure
- **Environment**: Node.js
- **Control**: Pure Vitest lifecycle hooks (`beforeAll`/`afterAll`)
- **Location**: `tests/e2e/setup-integration.test.ts`
- **Test Server Utility**: E2E tests use a custom server (`tests/e2e/server.ts`) for static test pages; see `tests/e2e/README.md` for manual/automated usage

**Legacy Playwright Tests** (Optional)

- **Framework**: Playwright (for comparison)
- **Purpose**: Real browser automation with extension loading
- **Environment**: Chromium browser with loaded extension
- **Location**: `tests/e2e/playwright-*.spec.ts`

**Key Achievements**:

- Zero external scripts—everything via `pnpm test` commands
- Automatic setup/teardown—no manual server management
- Unified test runner—single command controls all test types
- Integrated lifecycle—extension building, server startup, cleanup all automated
- Graceful shutdown—process signal handling for clean termination

## Development Workflow

1. **Setup**: `pnpm install`
2. **Development**: `pnpm dev`
3. **Load extension**: Chrome → Extensions → "Load unpacked" → select `dist` folder
4. **Testing**: `pnpm test` (Vitest)
5. **Quality check**: `pnpm check` (before commits)
6. **Production build**: `pnpm build`

## Dependency Management

Using pnpm for efficient package management:

- Lock file: `pnpm-lock.yaml`
- Workspace support
- Fast, deduplicated installs
- Strict peer dependency handling

## Chrome Extension Development

Extension loading for development:

1. Build: `pnpm build`
2. Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder
6. Reload extension after changes

## Recent Architectural Improvements

**Configuration Consolidation**:

- Eliminated URL/hostPatterns duplication
- Auto-generation from single source
- Simplified maintenance

**Build Pipeline Optimization**:

- Unified on Vitest for all test types
- Parallel execution support
- Consistent `pnpm check` behavior

**Repository Organization**:

- Clear separation of concerns
- Consistent test placement
- Logical module boundaries

dist/

## Build Process

esbuild handles all bundling with custom configuration:

- **Entry Points**: Three separate builds (background, content, popup)
- **Asset Processing**: Tailwind CSS compilation + static asset copying
- **Watch Mode**: Real-time rebuild with hot reload support
- **Chrome Extension Structure**: Outputs directly to `dist/` for extension loading

**Key Build Features:**

- TypeScript + Svelte compilation (WXT)
- Tailwind CSS processing via CLI (not PostCSS)
- Static asset copying (manifest, icons, HTML)
- Source maps in development, minification in production

Output structure:

```
dist/
├── background/background.js
├── content/content.js
├── popup/
│   ├── popup.js
│   ├── popup.html
│   └── popup.css       # Processed Tailwind
├── icons/
└── manifest.json
```

## Code Quality Standards

### TypeScript

- Strict mode enabled
- No `any` types allowed
- Full type coverage required

### ESLint Rules

- TypeScript-specific rules
- Svelte/JS import/export validation
- Automatic fixing enabled

### Testing Requirements

- Unit tests for all Svelte stores and modules
- E2E/infrastructure tests for extension build and startup
- Chrome API mocking via `@webext-core/fake-browser`
- 100% critical path coverage

## File Naming Conventions

- Components: PascalCase (`PopupApp.svelte`)
- Stores: camelCase with `use` prefix (`useSiteStore.ts`)
- Types: PascalCase (`SiteConfig.ts`)
- Tests: Same as source + `.test.` (`PopupApp.test.ts`)
- Configs: kebab-case (`site-config.ts`)

## Dependency Management

Using pnpm for efficient package management:

- Lock file: `pnpm-lock.yaml`
- Workspace support
- Fast, deduplicated installs
- Strict peer dependency handling

## Chrome Extension Development

Extension loading for development:

1. Build: `pnpm run build`
2. Chrome → `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select project root directory
6. Reload extension after changes

## Recent Architectural Improvements

**Configuration Consolidation**:

- Eliminated URL/hostPatterns duplication
- Auto-generation from single source
- Simplified maintenance

**Build Pipeline Optimization**:

- Jest stability improvements
- Parallel execution support
- Consistent `pnpm check` behavior

**Repository Organization**:

- Clear separation of concerns
- Consistent test placement
- Logical module boundaries
