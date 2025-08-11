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

# Run tests
pnpm test

# E2E tests with Playwright
pnpm test:e2e

# Type checking
pnpm type-check

# Linting
pnpm lint
```
