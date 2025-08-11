# WXT E2E Testing Guide

Source: https://wxt.dev/guide/essentials/e2e-testing.html

## Overview

Playwright is the only good option for writing Chrome Extension end-to-end tests with WXT.

## Setup Instructions

1. Follow Playwright's [Chrome Extension docs](https://playwright.dev/docs/chrome-extensions)
2. When passing the extension path, use the output directory: `/path/to/project/.output/chrome-mv3`

## Key Points

- E2E testing for Chrome extensions requires a persistent browser context
- WXT builds extensions to `.output/chrome-mv3` directory by default
- Playwright provides the best support for Chrome extension testing

## Example Projects

- [WXT's Playwright Example](https://github.com/wxt-dev/examples/tree/main/examples/playwright-e2e-testing)

## Integration with WXT

WXT's build system automatically generates the proper extension structure in `.output/chrome-mv3` that Playwright expects for Chrome extension testing.

## Configuration

When setting up Playwright tests:
1. Use `chromium` channel for headless extension testing
2. Point to WXT's output directory
3. Configure proper browser args for extension loading
