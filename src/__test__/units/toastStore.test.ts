import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToastStore } from '../../entrypoints/popup/stores/toastStore';
import { get } from 'svelte/store';

describe('ToastStore', () => {
  let toastStore: ToastStore;

  beforeEach(() => {
    toastStore = new ToastStore();
  });

  it('initializes with empty toasts array', () => {
    const toasts = get(toastStore.toasts);
    expect(toasts).toEqual([]);
  });

  it('adds success toast', () => {
    toastStore.success('Success message');

    const toasts = get(toastStore.toasts);
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      type: 'success',
      message: 'Success message',
      duration: 3000,
    });
    expect(toasts[0].id).toBeDefined();
  });

  it('adds error toast', () => {
    toastStore.error('Error message');

    const toasts = get(toastStore.toasts);
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      type: 'error',
      message: 'Error message',
      duration: 5000,
    });
  });

  it('adds info toast', () => {
    toastStore.info('Info message');

    const toasts = get(toastStore.toasts);
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      type: 'info',
      message: 'Info message',
      duration: 3000,
    });
  });

  it('removes toast by id', () => {
    toastStore.success('Test message');
    const toasts = get(toastStore.toasts);
    const toastId = toasts[0].id;

    toastStore.remove(toastId);

    const updatedToasts = get(toastStore.toasts);
    expect(updatedToasts).toHaveLength(0);
  });

  it('auto-removes toast after duration', async () => {
    vi.useFakeTimers();

    toastStore.success('Test message', 1000);

    let toasts = get(toastStore.toasts);
    expect(toasts).toHaveLength(1);

    // Fast-forward time
    vi.advanceTimersByTime(1000);

    toasts = get(toastStore.toasts);
    expect(toasts).toHaveLength(0);

    vi.useRealTimers();
  });

  it('handles multiple toasts', () => {
    toastStore.success('Message 1');
    toastStore.error('Message 2');
    toastStore.info('Message 3');

    const toasts = get(toastStore.toasts);
    expect(toasts).toHaveLength(3);
    expect(toasts.map((t) => t.message)).toEqual([
      'Message 1',
      'Message 2',
      'Message 3',
    ]);
  });

  it('removes specific toast without affecting others', () => {
    toastStore.success('Message 1');
    toastStore.error('Message 2');

    const toasts = get(toastStore.toasts);
    const firstToastId = toasts[0].id;

    toastStore.remove(firstToastId);

    const updatedToasts = get(toastStore.toasts);
    expect(updatedToasts).toHaveLength(1);
    expect(updatedToasts[0].message).toBe('Message 2');
  });

  it('generates unique IDs for toasts', () => {
    toastStore.success('Message 1');
    toastStore.success('Message 2');

    const toasts = get(toastStore.toasts);
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});
