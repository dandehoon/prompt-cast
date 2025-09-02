import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  toasts,
  toastActions,
} from '../../entrypoints/sidepanel/stores/toastStore';
import { get } from 'svelte/store';

describe('ToastStore', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    toastActions.clearAllToasts();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with empty toasts array', () => {
    const currentToasts = get(toasts);
    expect(currentToasts).toEqual([]);
  });

  it('adds success toast', () => {
    toastActions.showSuccess('Success message');

    const currentToasts = get(toasts);
    expect(currentToasts).toHaveLength(1);
    expect(currentToasts[0]).toMatchObject({
      type: 'success',
      message: 'Success message',
    });
    expect(currentToasts[0].id).toBeDefined();
  });

  it('adds error toast', () => {
    toastActions.showError('Error message');

    const currentToasts = get(toasts);
    expect(currentToasts).toHaveLength(1);
    expect(currentToasts[0]).toMatchObject({
      type: 'error',
      message: 'Error message',
    });
  });

  it('adds info toast', () => {
    toastActions.showInfo('Info message');

    const currentToasts = get(toasts);
    expect(currentToasts).toHaveLength(1);
    expect(currentToasts[0]).toMatchObject({
      type: 'info',
      message: 'Info message',
    });
  });

  it('removes toast by id', () => {
    toastActions.showSuccess('Test message');
    const currentToasts = get(toasts);
    const toastId = currentToasts[0].id;

    toastActions.removeToast(toastId);

    const updatedToasts = get(toasts);
    expect(updatedToasts).toHaveLength(0);
  });

  it('auto-removes toast after duration', async () => {
    toastActions.showSuccess('Test message', 1000);

    let currentToasts = get(toasts);
    expect(currentToasts).toHaveLength(1);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    currentToasts = get(toasts);
    expect(currentToasts).toHaveLength(0);
  });

  it('handles multiple toasts', () => {
    toastActions.showSuccess('Message 1');
    toastActions.showError('Message 2');
    toastActions.showInfo('Message 3');

    const currentToasts = get(toasts);
    expect(currentToasts).toHaveLength(3);
    expect(currentToasts.map((t) => t.message)).toEqual([
      'Message 1',
      'Message 2',
      'Message 3',
    ]);
  });

  it('removes specific toast without affecting others', () => {
    toastActions.showSuccess('Message 1');
    toastActions.showError('Message 2');

    const currentToasts = get(toasts);
    const firstToastId = currentToasts[0].id;

    toastActions.removeToast(firstToastId);

    const updatedToasts = get(toasts);
    expect(updatedToasts).toHaveLength(1);
    expect(updatedToasts[0].message).toBe('Message 2');
  });

  it('generates unique IDs for toasts', () => {
    toastActions.showSuccess('Message 1');
    toastActions.showSuccess('Message 2');

    const currentToasts = get(toasts);
    expect(currentToasts[0].id).not.toBe(currentToasts[1].id);
  });
});
