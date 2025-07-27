# Prompt Cast

Chrome extension for sending messages to multiple AI services simultaneously with React TSX interface.

## Features

- **Multi-Service**: Send to ChatGPT, Claude, Gemini, Grok at once
- **Smart Tabs**: Prevents duplicates, manages focus
- **Keyboard**: Enter sends, Shift+Enter new line
- **Toggles**: Enable/disable individual services
- **Persistent**: Remembers settings
- **Status**: Real-time connection indicators

## Quick Start

```bash
git clone <repo>
cd prompt-cast
pnpm install && pnpm run build
```

Load in Chrome: `chrome://extensions/` → "Load unpacked" → select folder

## Usage

1. Click extension icon
2. Type message
3. Press **Enter** to send (Shift+Enter for new line)
4. Toggle services on/off as needed

## Architecture

```
src/
├── shared/           # Types & utilities
├── popup/
│   ├── components/   # React TSX components
│   ├── hooks/        # Custom hooks
│   └── popup.tsx     # Entry point
├── content/          # Content script
└── background/       # Service worker
```

## Services

| Service | URL                 | Status |
| ------- | ------------------- | ------ |
| ChatGPT | `chatgpt.com`       | ✅     |
| Claude  | `claude.ai`         | ✅     |
| Gemini  | `gemini.google.com` | ✅     |
| Grok    | `grok.com`          | ✅     |

## Development

```bash
pnpm run build        # Production
pnpm run watch        # Development
pnpm run type-check   # TypeScript
```

## Tech Stack

- React 18 + TypeScript
- esbuild with JSX
- Tailwind CSS
- Chrome Extension API (Manifest V3)

**Status: Production Ready** ✅
