# Prompt Cast

[![Test](https://github.com/dandehoon/prompt-cast/actions/workflows/test.yml/badge.svg)](https://github.com/dandehoon/prompt-cast/actions/workflows/test.yml)
[![Version](https://img.shields.io/github/v/release/dandehoon/prompt-cast)](https://github.com/dandehoon/prompt-cast/releases)
[![License](https://img.shields.io/github/license/dandehoon/prompt-cast)](LICENSE)

Chrome extension for sending messages to multiple AI sites simultaneously with React TSX interface.

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

## Architecture

```
src/
├── manifest.json
├── shared/           # Types & utilities
├── popup/
│   ├── components/   # React TSX components
│   ├── hooks/        # Custom hooks
│   └── popup.tsx     # Entry point
├── content/          # Content script
└── background/       # Site worker
```

## Sites

| Site    | URL                 | Status |
| ------- | ------------------- | ------ |
| ChatGPT | `chatgpt.com`       | ✅     |
| Claude  | `claude.ai`         | ✅     |
| Gemini  | `gemini.google.com` | ✅     |
| Grok    | `grok.com`          | ✅     |

## Development

```bash
# Install dependencies
pnpm install

# Development with hot reload
pnpm run watch

# Build for production
pnpm run build

# Type check
pnpm run type-check

# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage

# Lint and fix
pnpm run lint

# Run all checks (type-check + lint + test + build)
pnpm check
```

### Quality Control

Before submitting PRs, always run:

```bash
pnpm check
```

This runs the complete pipeline: type checking, linting, testing, and building.

## Tech Stack

- React 18 + TypeScript
- esbuild with JSX
- Tailwind CSS
- Chrome Extension API (Manifest V3)

**Status: Production Ready** ✅
