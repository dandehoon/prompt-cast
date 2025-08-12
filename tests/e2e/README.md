# Test Server Utility

This directory contains utilities for running the Prompt Cast E2E test server.

## Files

- `server.ts` - Reusable server utility with start/stop functions
- `global-setup.ts` - Playwright global setup that uses the server utility
- `fixtures.ts` - Playwright test fixtures for extension testing

## Manual Testing

### Start the test server manually

```bash
pnpm test:server
```

This will start the server at `http://localhost:3000` with:

- **Home page**: `http://localhost:3000` - Lists all available test pages
- **Test pages**:
  - `http://localhost:3000/claude`
  - `http://localhost:3000/gemini`
  - `http://localhost:3000/perplexity`
- **Health check**: `http://localhost:3000/health` - Server status endpoint

### Custom port/host

```bash
# Custom port
pnpm tsx tests/e2e/server.ts 8080

# Custom port and host
pnpm tsx tests/e2e/server.ts 8080 0.0.0.0
```

### Stop the server

Press `Ctrl+C` in the terminal running the server.

## Automated Testing

The server is automatically managed during E2E tests:

```bash
pnpm test:e2e
```

The server will:

1. Start once before all tests begin (global setup)
2. Be shared across all test workers
3. Stop automatically after all tests complete

## Server Features

- ✅ Static file serving from test pages
- ✅ Graceful shutdown handling
- ✅ Port conflict detection
- ✅ Health check endpoint
- ✅ Friendly home page with test links
- ✅ CLI usage support
- ✅ Configurable host/port
