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
pnpm install && pnpm run build
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

- React 18 + TypeScript
- esbuild with JSX
- Tailwind CSS
- Chrome Extension API (Manifest V3)

### Architecture

```
src/
├── manifest.json
├── shared/           # Types, utilities, and messaging
├── popup/            # React UI, Zustand store, hooks, and components
├── content/          # Content scripts for DOM injection and readiness
├── background/       # Service worker, site config, tab/message/site managers
```

### Commands

```bash
# Install dependencies
pnpm install

# Dev mode with hot reload
pnpm watch

# Production build
pnpm build

# Type-check, lint, test, build
pnpm check
```
