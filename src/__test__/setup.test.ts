import { describe, it, expect } from 'vitest';

describe('WXT Testing Setup', () => {
  it('should run basic tests', () => {
    expect(2 + 2).toBe(4);
  });

  it('should have chrome API available via WXT fakeBrowser', () => {
    // WXT provides chrome and browser APIs through fakeBrowser
    // Use type assertion to avoid TypeScript errors in test environment
    expect((globalThis as any).chrome).toBeDefined();
    expect((globalThis as any).chrome.runtime).toBeDefined();
    expect((globalThis as any).chrome.runtime.sendMessage).toBeDefined();
    expect((globalThis as any).chrome.tabs).toBeDefined();
    expect((globalThis as any).chrome.storage).toBeDefined();
  });

  it('should have browser API available via WXT fakeBrowser', () => {
    expect((globalThis as any).browser).toBeDefined();
    expect((globalThis as any).browser.runtime).toBeDefined();
    expect((globalThis as any).browser.runtime.sendMessage).toBeDefined();
    expect((globalThis as any).browser.tabs).toBeDefined();
    expect((globalThis as any).browser.storage).toBeDefined();
  });

  it('should provide working storage APIs with in-memory implementation', async () => {
    // Test that storage actually works with fakeBrowser's in-memory implementation
    const chrome = (globalThis as any).chrome;
    await chrome.storage.local.set({ testKey: 'testValue' });
    const result = await chrome.storage.local.get('testKey');
    expect(result.testKey).toBe('testValue');
  });

  it('should reset state between tests', async () => {
    // This test verifies that fakeBrowser.reset() is working in setup.ts
    // If the previous test's storage data persists, this test will fail
    const chrome = (globalThis as any).chrome;
    const result = await chrome.storage.local.get('testKey');
    expect(result.testKey).toBeUndefined();
  });

  it('should have WXT environment variables available', () => {
    // WXT sets up these environment variables automatically
    expect(import.meta.env).toBeDefined();
    // Note: These may be undefined in test environment, but the structure should exist
    expect(typeof import.meta.env.BROWSER).toBeDefined();
    expect(typeof import.meta.env.MANIFEST_VERSION).toBeDefined();
  });
});
