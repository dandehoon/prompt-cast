````instructions
# AI Agent Instructions for Prompt Cast Chrome Extension

## Project Overview

Chrome extension (manifest v3) with React TSX popup interface. TypeScript monorepo with build tooling, testing, and quality automation.

## Repository Structure

```
src/
├── background/           # Background script + modules
│   ├── config/          # Site configurations
│   └── modules/         # TabManager, MessageHandler, SiteManager
├── content/             # Content scripts for DOM injection
├── popup/               # React popup interface
│   ├── components/      # React components + tests
│   ├── hooks/          # Custom hooks + tests
│   └── stores/         # State management
├── shared/             # Shared utilities and types
└── types/              # TypeScript type definitions

dist/                   # Build output (auto-generated)
node_modules/          # Dependencies
.github/               # GitHub workflows and instructions
```

## Essential Commands

### Development
```bash
pnpm install              # Install dependencies
pnpm run watch            # Development mode with hot reload
pnpm run dev              # Alias for watch mode
```

### Quality Control
```bash
pnpm check               # Complete pipeline: type-check + lint + test + build
pnpm run type-check      # TypeScript compilation validation
pnpm run lint            # ESLint check and auto-fix
pnpm test                # Run all tests with Jest
pnpm run build           # Production build
```

### Testing
```bash
pnpm test                # Run all tests
pnpm test:watch          # Watch mode for tests
pnpm test:coverage       # Generate coverage report
pnpm test -- ThemeSelector  # Run specific test file
```

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

Jest + React Testing Library with Chrome API mocking:
- Test files: `src/**/__tests__/**/*.{test,spec}.{ts,tsx}`
- Mock setup: `src/shared/test-setup.ts`
- Stable configuration: `maxWorkers: '50%'`, `reporters: ['default']`
- Coverage collection from all source files
- One intentionally skipped test (documented in code)

## Development Workflow

1. **Setup**: `pnpm install`
2. **Development**: `pnpm run watch`
3. **Load extension**: Chrome → Extensions → "Load unpacked" → select project root
4. **Testing**: `pnpm test` or `pnpm test:watch`
5. **Quality check**: `pnpm check` (before commits)
6. **Production build**: `pnpm run build`

## Build Process

esbuild handles all bundling:
- Entry points: background, content, popup
- TypeScript compilation
- CSS processing with Tailwind
- Watch mode for development
- Production optimization

Output structure:
```
dist/
├── background/
├── content/
├── popup/
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

````
