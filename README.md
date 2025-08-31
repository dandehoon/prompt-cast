# Prompt Cast

[![Test](https://github.com/dandehoon/prompt-cast/actions/workflows/test.yml/badge.svg)](https://github.com/dandehoon/prompt-cast/actions/workflows/test.yml)
[![Version](https://img.shields.io/github/v/release/dandehoon/prompt-cast)](https://github.com/dandehoon/prompt-cast/releases)
[![License](https://img.shields.io/github/license/dandehoon/prompt-cast)](LICENSE)

Useful Chrome extension for broadcasting prompts to multiple AI chat sites at once with robust tab management.

## Features

- **Multi-Site**: Send to ChatGPT, Claude, Gemini, Grok... at once
- **Side Panel UI**: Persistent Chrome side panel interface for better workflow
- **Smart Tabs**: Prevents duplicates, manages focus
- **Keyboard Shortcuts**: Alt+P opens side panel, Alt+Shift+P closes all tabs
- **Toggles**: Enable/disable individual sites
- **Persistent**: Remembers settings
- **Status**: Real-time connection indicators
- **Enhanced Themes**: Light/dark/auto with comprehensive CSS variable system

## Quick Start

```bash
git clone https://github.com/dandehoon/prompt-cast
cd prompt-cast
pnpm install && pnpm build
```

Load in Chrome: `chrome://extensions/` → "Load unpacked" → select the `dist` folder

The extension will appear in your toolbar with the Prompt Cast icon. Click to open the side panel interface.

## Usage

1. Click extension icon or press **Alt+P** to open side panel
2. Type message in the bottom input area
3. Press **Enter** to send (Shift+Enter for new line)
4. Toggle sites on/off as needed
5. Use **Alt+Shift+P** to quickly close all AI site tabs

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
│   └── sidepanel/       # Svelte side panel UI with stores
├── shared/              # Types, utilities, messaging, focus management
├── background/          # Background script modules
└── types/               # TypeScript definitions
```

### Commands

```bash
# Install dependencies
pnpm install

# Development (hot reload)
pnpm dev

# Build for production
pnpm build

# Run all tests (Vitest)
pnpm test

# Quality checks (type-check, lint, test, build)
pnpm check
```
