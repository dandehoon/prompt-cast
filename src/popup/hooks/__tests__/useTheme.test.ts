import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { useStorage } from '../useStorage';
import { THEME_OPTIONS } from '../../../shared/constants';
import { logger } from '../../../shared/logger';

// Mock the useStorage hook
jest.mock('../useStorage');
const mockUseStorage = useStorage as jest.MockedFunction<typeof useStorage>;
// Mock logger
jest.mock('../../../shared/logger');
const mockLogger = logger as jest.Mocked<typeof logger>;

// Mock DOM APIs
const mockMatchMedia = jest.fn();
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

describe('useTheme', () => {
  const mockSavePreferences = jest.fn();
  const mockMediaQuery = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStorage.mockReturnValue({
      preferences: null,
      loading: false,
      error: null,
      savePreferences: mockSavePreferences,
      updateSiteEnabled: jest.fn(),
      reload: jest.fn(),
    });
    mockMatchMedia.mockReturnValue(mockMediaQuery);
  });

  it('should initialize with auto theme by default', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.currentTheme).toBe(THEME_OPTIONS.AUTO);
    expect(result.current.resolvedTheme).toBe('light');
    expect(result.current.systemTheme).toBe('light');
  });

  it('should detect dark system theme', () => {
    mockMediaQuery.matches = true;
    mockMatchMedia.mockReturnValue({ ...mockMediaQuery, matches: true });

    const { result } = renderHook(() => useTheme());

    expect(result.current.systemTheme).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should load theme from storage', () => {
    mockUseStorage.mockReturnValue({
      preferences: { sites: {}, theme: THEME_OPTIONS.DARK },
      loading: false,
      error: null,
      savePreferences: mockSavePreferences,
      updateSiteEnabled: jest.fn(),
      reload: jest.fn(),
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.currentTheme).toBe(THEME_OPTIONS.DARK);
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should change theme and save to storage', async () => {
    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.changeTheme(THEME_OPTIONS.DARK);
    });

    expect(result.current.currentTheme).toBe(THEME_OPTIONS.DARK);
    expect(result.current.resolvedTheme).toBe('dark');
    expect(mockSavePreferences).toHaveBeenCalledWith({
      sites: {},
      theme: THEME_OPTIONS.DARK,
    });
  });

  it('should resolve auto theme to system theme', () => {
    mockMediaQuery.matches = true;
    mockMatchMedia.mockReturnValue({ ...mockMediaQuery, matches: true });

    const { result } = renderHook(() => useTheme());

    // Auto theme should resolve to system theme (dark)
    expect(result.current.currentTheme).toBe(THEME_OPTIONS.AUTO);
    expect(result.current.resolvedTheme).toBe('dark');
  });

  it('should return correct theme options', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.themeOptions).toEqual([
      { value: THEME_OPTIONS.AUTO, label: 'Auto' },
      { value: THEME_OPTIONS.LIGHT, label: 'Light' },
      { value: THEME_OPTIONS.DARK, label: 'Dark' },
    ]);
  });

  it('should handle storage errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSavePreferences.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.changeTheme(THEME_OPTIONS.DARK);
    });

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to save theme preference:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it('should handle missing window/matchMedia gracefully', () => {
    const originalMatchMedia = window.matchMedia;
    // @ts-expect-error - Intentionally setting matchMedia to undefined for testing
    window.matchMedia = undefined;

    const { result } = renderHook(() => useTheme());

    expect(result.current.systemTheme).toBe('light');

    window.matchMedia = originalMatchMedia;
  });
});
