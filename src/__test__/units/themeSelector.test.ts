import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeSelector } from '../../entrypoints/popup/components/Settings/ThemeSelector.svelte';
import { render, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';

// Mock the theme store
vi.mock('../../entrypoints/popup/stores/themeStore', () => ({
  theme: writable('system'),
  setTheme: vi.fn(),
}));

describe('ThemeSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme selector options', () => {
    const { getByText, getByDisplayValue } = render(ThemeSelector);

    // Check if theme options are present
    expect(getByText('Theme')).toBeInTheDocument();
    expect(getByDisplayValue('system')).toBeInTheDocument();
  });

  it('calls setTheme when selection changes', async () => {
    const { setTheme } = await import(
      '../../entrypoints/popup/stores/themeStore'
    );
    const { getByDisplayValue } = render(ThemeSelector);

    const select = getByDisplayValue('system');

    // Change to dark theme
    await fireEvent.change(select, { target: { value: 'dark' } });

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('reflects current theme value', () => {
    const { getByDisplayValue } = render(ThemeSelector);

    // Should show current theme value
    expect(getByDisplayValue('system')).toBeInTheDocument();
  });
});
