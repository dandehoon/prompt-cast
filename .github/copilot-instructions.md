# AI Agent Instructions for Prompt Cast Chrome Extension

## Project Overview

Chrome extension (manifest v3) that broadcasts messages to multiple AI services simultaneously (ChatGPT, Claude, Gemini, Grok) with React TSX popup interface.

## Architecture Pattern

3-layer Chrome extension architecture with sophisticated messaging system:

- **Background service worker** (`src/background/`) - Service orchestration, tab management, retry logic
- **Content scripts** (`src/content/`) - DOM injection per AI service with service-specific configs
- **React popup** (`src/popup/`) - User interface with hooks-based state management

## Critical Service Configuration

Each AI service uses different DOM patterns - all config centralized in `src/shared/serviceConfig.ts`:

```typescript
SERVICE_CONFIGS = {
  chatgpt: {
    inputSelectors: ['div#prompt-textarea'],
    usesContentEditable: true,
  },
  claude: {
    inputSelectors: ['div[contenteditable]'],
    extraEvents: ['beforeinput'],
  },
  // ... service-specific injection patterns
};
```

## Message Injection Strategy

Content scripts handle complex DOM scenarios:

- **ChatGPT/Claude**: contentEditable divs requiring selection API and composition events
- **Grok**: Standard textarea with native value setter
- **Gemini**: Rich text editor (ql-editor) needing innerHTML updates
- All services use retry logic with exponential backoff for reliability

## Build System

Custom esbuild config (`esbuild.config.js`) with:

- Watch mode: `pnpm run watch` - auto-rebuilds + Tailwind processing
- Production: `pnpm run build` - minified bundles for all 3 entry points
- Always run Tailwind CSS processing: `tailwindcss -i ./src/popup/popup.css -o ./dist/popup/popup.css`

## State Management Patterns

React hooks architecture in `src/popup/hooks/`:

- `useServices` - Service state, connection status, toggle logic
- `useStorage` - Chrome storage sync with preferences persistence
- `useMessageHandler` - Send logic with loading states and error handling
- Each hook handles specific domain, composed in `PopupApp.tsx`

## Testing Setup

Jest + React Testing Library with comprehensive Chrome API mocking:

- Mock setup in `src/test-utils/setup.ts` covers chrome.runtime, chrome.storage, chrome.tabs
- Tests focus on hooks logic and component behavior, not Chrome API integration
- Run: `pnpm test` (watch: `pnpm test:watch`)

## Development Workflow

1. `pnpm run watch` for development with hot reload
2. Load extension: chrome://extensions → "Load unpacked" → select project root
3. Test changes via extension popup, check console for background/content script logs
4. Use `pnpm run type-check` for TypeScript validation before commits
5. **ALWAYS run `pnpm check` before completing any task** - this runs type-check, lint, test, and build

## Quality Control & Verification

**CRITICAL**: Every code change MUST be verified with the complete check pipeline:

```bash
pnpm check  # Runs: type-check + lint + test + build
```

This command is **MANDATORY** as the final verification step for any:

- Bug fixes
- Feature implementations
- Refactoring
- Code cleanup
- Test updates

**Never consider a task complete until `pnpm check` passes without errors.**

### Available Commands

- `pnpm test` - Run all tests
- `pnpm test:watch` - Watch mode for testing
- `pnpm test:coverage` - Generate coverage report
- `pnpm run lint` - Check and auto-fix code style and quality issues
- `pnpm run type-check` - TypeScript compilation check
- `pnpm run build` - Build extension for production
- `pnpm check` - **Complete quality pipeline** (type-check + lint + test + build)

## Service Status System

Real-time connection tracking via background service:

- `connected` - Tab open and content script responding
- `loading` - Tab opening or content script initializing
- `disconnected` - No tab or content script not ready
- `error` - Failed injection or tab operation

## Chrome Extension Gotchas

- Service worker lifecycle: State persisted in class instance, not globals
- Content script injection timing: Always use retry logic with `waitForContentScriptReady()`
- Tab management: Track tabIds, handle manual tab closures via `chrome.tabs.onRemoved`
- Permissions: Host permissions in manifest.json must match exact service domains

## Component Patterns

- Custom Tailwind theme with `ai-*` color tokens for dark UI consistency
- Controlled inputs with ref forwarding for focus management
- Loading states bubble up through hooks to disable UI during operations
- Toast notifications via custom hook for user feedback

## Key Files for Architecture Understanding

- `src/shared/serviceConfig.ts` - Service definitions and DOM selectors
- `src/background/background.ts` - Core orchestration and retry logic
- `src/content/content.ts` - DOM injection patterns per service
- `src/popup/components/PopupApp.tsx` - Main component composition
