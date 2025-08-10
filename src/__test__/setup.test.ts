import { describe, it, expect } from 'vitest';

describe('Basic Vitest Setup', () => {
  it('should run basic tests', () => {
    expect(2 + 2).toBe(4);
  });

  it('should have mocked chrome API available', () => {
    expect((global as any).chrome).toBeDefined();
    expect((global as any).chrome.runtime.sendMessage).toBeDefined();
  });

  it('should have mocked browser API available', () => {
    expect((global as any).browser).toBeDefined();
    expect((global as any).browser.runtime.sendMessage).toBeDefined();
  });

  it('should have mocked localStorage', () => {
    expect(window.localStorage).toBeDefined();
    expect(window.localStorage.getItem).toBeDefined();
  });

  it('should have mocked matchMedia', () => {
    expect(window.matchMedia).toBeDefined();
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    expect(media.matches).toBe(false);
  });
});
