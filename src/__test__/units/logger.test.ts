import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../../shared/logger';

// Mock console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  info: console.info,
};

describe('Logger', () => {
  beforeEach(() => {
    // Mock console methods
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.debug = vi.fn();
    console.info = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    Object.assign(console, originalConsole);
  });

  it('logs info messages', () => {
    logger.info('Test info message');
    expect(console.info).toHaveBeenCalledWith('Test info message');
  });

  it('logs warning messages', () => {
    logger.warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith('Test warning message');
  });

  it('logs error messages', () => {
    logger.error('Test error message');
    expect(console.error).toHaveBeenCalledWith('Test error message');
  });

  it('logs debug messages', () => {
    logger.debug('Test debug message');
    expect(console.log).toHaveBeenCalledWith('Test debug message');
  });

  it('handles objects and arrays', () => {
    const testObject = { key: 'value', number: 42 };
    logger.info('Object test:', testObject);

    expect(console.info).toHaveBeenCalledWith('Object test:', testObject);
  });

  it('handles multiple arguments', () => {
    logger.error('Error:', 'Multiple', 'arguments', 123);

    expect(console.error).toHaveBeenCalledWith(
      'Error:',
      'Multiple',
      'arguments',
      123,
    );
  });

  it('logs errors with stack traces', () => {
    const error = new Error('Test error');
    logger.error('Exception occurred:', error);

    expect(console.error).toHaveBeenCalledWith('Exception occurred:', error);
  });
});
