# AI Agent Instructions for Prompt Cast Chrome Extension

## Project Overview

Chrome extension (manifest v3) with React TSX popup interface. Multi-site AI messaging with sophisticated tab management, content script injection, and state synchronization across background/popup/content contexts.

## Architecture & Data Flow

**Three-Context Communication Pattern:**

- **Background Service Worker**: Tab/site management, message routing, persistent state
- **Popup React App**: User interface, site toggles, message composition
- **Content Scripts**: DOM injection, input detection, message injection per AI site

**Message Flow:**

1. User types in popup → Background script → Content scripts (broadcast to enabled sites)
2. Site configuration changes → Background storage → Popup state sync
3. Tab events → Background tab manager → Popup status updates

## Repository Structure

```
src/
├── background/           # Service worker + modules
│   ├── config/          # Site-specific configurations & selectors
│   ├── modules/         # TabManager, MessageHandler, SiteManager
│   └── stores/          # Background state management
├── content/             # Content scripts for DOM injection
│   └── modules/         # InjectionHandler, ReadinessChecker
├── popup/               # React popup interface
│   ├── components/      # React components + tests
│   ├── hooks/          # Custom hooks + tests
│   └── stores/         # Popup state management (Zustand)
├── shared/             # Cross-context utilities
│   └── test-setup.ts   # Chrome API mocking for tests
└── types/              # TypeScript definitions
```

## Essential Commands

### Development

```bash
pnpm install              # Install dependencies
pnpm run watch            # Development mode with hot reload + Tailwind CSS processing
pnpm run dev              # Alias for watch mode
```

### Quality Control

```bash
pnpm check               # Complete pipeline: type-check + lint + test + build
pnpm run type-check      # TypeScript compilation validation
pnpm run lint            # ESLint check and auto-fix
pnpm test                # Run all tests with Jest
pnpm run build           # Production build (includes Tailwind CSS processing)
```

### Testing

```bash
pnpm test                # Run all tests
pnpm test:watch          # Watch mode for tests
pnpm test:coverage       # Generate coverage report
pnpm test -- ThemeSelector  # Run specific test file
```

## Critical Architecture Patterns

### Site Configuration System

- **Single Source of Truth**: `src/background/config/siteConfig.ts` contains all site configs
- **Auto-generation**: `hostPatterns` auto-generated from URLs to prevent duplication
- **Site-Specific Selectors**: Each site has `inputSelectors`/`submitSelectors` arrays for DOM targeting
- **Injection Methods**: Some sites (Perplexity) use `execCommand` instead of direct value setting

### Chrome Extension Communication

- **ChromeMessaging Class**: `src/shared/messaging.ts` - centralized Chrome API wrapper
- **Type-Safe Messages**: All messages typed in `src/types/messages.ts` with discriminated unions
- **Error Handling**: All Chrome API calls wrapped with try/catch and consistent error responses

### Content Script Injection Strategy

- **Readiness Checking**: `waitForContentScriptReady()` with retry logic and fallback injection
- **Graceful Degradation**: Continues operation even if some content scripts fail to load
- **Manual Injection**: Fallback for sites like Gemini that load content scripts slowly

### State Management Pattern

- **Background**: Direct Chrome storage API for persistence
- **Popup**: Zustand stores (`siteUIStore.ts`) for React state
- **Synchronization**: Background ↔ Popup sync via message passing on state changes

## Mandatory Quality Pipeline

**CRITICAL**: Every code change MUST pass the complete verification pipeline:

```bash
pnpm check
```

This runs:

1. TypeScript compilation check
2. ESLint code quality checks
3. Full test suite (Jest + React Testing Library)
4. Production build verification

**Never consider any task complete until `pnpm check` passes without errors.**

## Configuration Files

### Build & Tooling

- `esbuild.config.js` - Build configuration (watch/production modes)
- `jest.config.js` - Test configuration (stable parallel execution)
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

Jest + React Testing Library with comprehensive Chrome API mocking:

- **Test Location**: `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- **Mock Setup**: `src/shared/test-setup.ts` - Complete Chrome API simulation
- **Parallel Execution**: `maxWorkers: '50%'` for stability
- **Coverage**: All source files, excludes tests and type definitions

**Testing Patterns:**

- Hooks tested with `renderHook()` and `act()`
- Components tested with integration approach
- Chrome API calls mocked with jest.Mocked types
- Async operations tested with proper promise handling
- One intentionally skipped test (documented in code)

**Key Test Examples:**

- `useTabOperations.test.ts` - Complex hook with Chrome messaging
- `PopupApp.test.tsx` - Full component integration

## Development Workflow

1. **Setup**: `pnpm install`
2. **Development**: `pnpm run watch`
3. **Load extension**: Chrome → Extensions → "Load unpacked" → select project root
4. **Testing**: `pnpm test` or `pnpm test:watch`
5. **Quality check**: `pnpm check` (before commits)
6. **Production build**: `pnpm run build`

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

## Build Process

esbuild handles all bundling with custom configuration:

- **Entry Points**: Three separate builds (background, content, popup)
- **Asset Processing**: Tailwind CSS compilation + static asset copying
- **Watch Mode**: Real-time rebuild with hot reload support
- **Chrome Extension Structure**: Outputs directly to `dist/` for extension loading

**Key Build Features:**

- TypeScript + JSX compilation with React automatic runtime
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
- React hooks rules
- Import/export validation
- Automatic fixing enabled

### Testing Requirements

- Unit tests for all hooks
- Component integration tests
- Chrome API mocking
- 100% critical path coverage

## File Naming Conventions

- Components: PascalCase (`PopupApp.tsx`)
- Hooks: camelCase with `use` prefix (`useTabOperations.ts`)
- Types: PascalCase (`SiteConfig.ts`)
- Tests: Same as source + `.test.` (`PopupApp.test.tsx`)
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
