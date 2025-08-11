import { describe, it, expect, beforeEach, vi } from 'vitest';
import { utils } from '../../shared/utils';

describe('Utils', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debouncedFn = utils.debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('cancels previous calls', () => {
      const fn = vi.fn();
      const debouncedFn = utils.debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('passes arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = utils.debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('limits function calls', () => {
      const fn = vi.fn();
      const throttledFn = utils.throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(100);
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatError', () => {
    it('formats Error objects', () => {
      const error = new Error('Test error');
      const formatted = utils.formatError(error);

      expect(formatted).toContain('Test error');
      expect(formatted).toContain('Error:');
    });

    it('formats string errors', () => {
      const error = 'String error message';
      const formatted = utils.formatError(error);

      expect(formatted).toBe('String error message');
    });

    it('formats unknown errors', () => {
      const error = { unknown: 'object' };
      const formatted = utils.formatError(error);

      expect(formatted).toContain('Unknown error');
    });

    it('handles null/undefined errors', () => {
      expect(utils.formatError(null)).toBe('Unknown error: null');
      expect(utils.formatError(undefined)).toBe('Unknown error: undefined');
    });
  });

  describe('isValidUrl', () => {
    it('validates correct URLs', () => {
      expect(utils.isValidUrl('https://example.com')).toBe(true);
      expect(utils.isValidUrl('http://localhost:3000')).toBe(true);
      expect(utils.isValidUrl('https://sub.domain.com/path')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(utils.isValidUrl('not-a-url')).toBe(false);
      expect(utils.isValidUrl('ftp://example.com')).toBe(false);
      expect(utils.isValidUrl('')).toBe(false);
      expect(utils.isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('sanitizeMessage', () => {
    it('removes HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello <b>world</b>';
      const output = utils.sanitizeMessage(input);

      expect(output).toBe('Hello world');
      expect(output).not.toContain('<script>');
      expect(output).not.toContain('<b>');
    });

    it('trims whitespace', () => {
      const input = '  \n  Hello world  \n  ';
      const output = utils.sanitizeMessage(input);

      expect(output).toBe('Hello world');
    });

    it('handles empty strings', () => {
      expect(utils.sanitizeMessage('')).toBe('');
      expect(utils.sanitizeMessage('   ')).toBe('');
    });

    it('limits message length', () => {
      const longMessage = 'A'.repeat(10000);
      const output = utils.sanitizeMessage(longMessage);

      expect(output.length).toBeLessThanOrEqual(5000); // Assuming 5000 char limit
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays execution', async () => {
      const promise = utils.sleep(1000);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(1000);
      await promise;

      expect(resolved).toBe(true);
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = utils.generateId();
      const id2 = utils.generateId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('generates IDs with specified prefix', () => {
      const id = utils.generateId('test');

      expect(id).toMatch(/^test-/);
    });
  });
});
