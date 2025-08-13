# Prompt Cast

[![Test](https://github.com/dandehoon/prompt-cast/actions/workflows/test.yml/badge.svg)](https://github.com/dandehoon/prompt-cast/actions/workflows/test.yml)
[![Version](https://img.shields.io/github/v/release/dandehoon/prompt-cast)](https://github.com/dandehoon/prompt-cast/releases)
[![License](https://img.shields.io/github/license/dandehoon/prompt-cast)](LICENSE)

Useful Chrome extension for broadcasting prompts to multiple AI chat sites at once with robust tab management.

## Features

- **Multi-Site**: Send to ChatGPT, Claude, Gemini, Grok... at once
- **Smart Tabs**: Prevents duplicates, manages focus
- **Keyboard**: Enter sends, Shift+Enter new line
- **Toggles**: Enable/disable individual sites
- **Persistent**: Remembers settings
- **Status**: Real-time connection indicators

## Quick Start

```bash
git clone https://github.com/dandehoon/prompt-cast
cd prompt-cast
pnpm install && pnpm build
```

Load in Chrome: `chrome://extensions/` → "Load unpacked" → select the `dist` folder

The extension will appear in your toolbar with the Prompt Cast icon.

## Usage

1. Click extension icon
2. Type message
3. Press **Enter** to send (Shift+Enter for new line)
4. Toggle sites on/off as needed

## Sites

| Site       | URL                     | Status |
| ---------- | ----------------------- | ------ |
| ChatGPT    | `chatgpt.com`           | ✅     |
| Claude     | `claude.ai`             | ✅     |
| Gemini     | `gemini.google.com`     | ✅     |
| Grok       | `grok.com`              | ✅     |
| Perplexity | `perplexity.ai`         | ✅     |
| Copilot    | `copilot.microsoft.com` | ✅     |

## Development

### Tech Stack

- **WXT Framework** - Modern web extension development
- **Svelte 5** + TypeScript - Reactive UI components
- **Tailwind CSS** - Utility-first styling
- **Playwright** - End-to-end testing
- **Vitest** - Unit testing
- **Chrome Extension API** (Manifest V3)

### Architecture

```
src/
├── entrypoints/         # WXT entry points
│   ├── background.ts    # Service worker
│   ├── content.ts       # Content script
│   └── popup/           # Svelte popup UI with stores
├── shared/              # Types, utilities, messaging
├── content/             # Content script modules
├── background/          # Background script modules
└── types/               # TypeScript definitions
```

### Commands

```bash
# Install dependencies
pnpm install

# Dev mode with hot reload
pnpm dev

# Production build
pnpm build

# Testing (All controlled via Vitest)
pnpm test              # Run all tests in watch mode
pnpm test:run          # Run all tests once
pnpm test:ui           # Run tests with UI
pnpm test:coverage     # Run tests with coverage
pnpm test:setup        # Run E2E setup integration tests only

# Legacy Playwright (for comparison, optional)
pnpm test:e2e:playwright        # Run original Playwright tests
pnpm test:e2e:playwright:headed # Run Playwright tests with browser UI
pnpm test:e2e:playwright:ui     # Run Playwright tests with Playwright UI

# Quality checks
pnpm check             # Complete pipeline: type-check + lint + test + build
pnpm type-check        # TypeScript compilation
pnpm lint              # ESLint check and fix
```

### Testing Architecture

**🎯 Unified Vitest Control**

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
- **Benefits**: Ensures all infrastructure is ready for actual browser testing

**Legacy Playwright Tests** (Optional)

- **Framework**: Playwright (for comparison)
- **Purpose**: Real browser automation with extension loading
- **Environment**: Chromium browser with loaded extension
- **Location**: `tests/e2e/playwright-*.spec.ts`

**🚀 Key Achievements**:

- ✅ **Zero external scripts** - Everything via `pnpm test` commands
- ✅ **Automatic setup/teardown** - No manual server management
- ✅ **Unified test runner** - Single command controls all test types
- ✅ **Integrated lifecycle** - Extension building, server startup, cleanup all automated
- ✅ **Graceful shutdown** - Process signal handling for clean termination
