import { renderHook, act } from '@testing-library/react';
import { useStorage } from '../useStorage';
import { ChromeStorage } from '../../../shared/storage';
import { UserPreferences } from '../../../shared/types';

// Mock the ChromeStorage module
jest.mock('../../../shared/storage');

const mockChromeStorage = ChromeStorage as jest.Mocked<typeof ChromeStorage>;

describe('useStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load preferences on mount', async () => {
    const mockPreferences: UserPreferences = {
      services: {
        chatgpt: { enabled: true },
        claude: { enabled: false },
      },
    };

    mockChromeStorage.getUserPreferences.mockResolvedValue(mockPreferences);

    const { result } = renderHook(() => useStorage());

    expect(result.current.loading).toBe(true);

    // Wait for async operation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.preferences).toEqual(mockPreferences);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading error', async () => {
    const errorMessage = 'Failed to load';
    mockChromeStorage.getUserPreferences.mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.preferences).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  it('should save preferences', async () => {
    const mockPreferences: UserPreferences = {
      services: {
        chatgpt: { enabled: true },
      },
    };

    mockChromeStorage.getUserPreferences.mockResolvedValue(null);
    mockChromeStorage.saveUserPreferences.mockResolvedValue();

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await result.current.savePreferences(mockPreferences);
    });

    expect(mockChromeStorage.saveUserPreferences).toHaveBeenCalledWith(
      mockPreferences,
    );
    expect(result.current.preferences).toEqual(mockPreferences);
    expect(result.current.error).toBeNull();
  });

  it('should handle save error', async () => {
    const mockPreferences: UserPreferences = { services: {} };
    const errorMessage = 'Save failed';

    mockChromeStorage.getUserPreferences.mockResolvedValue(null);
    mockChromeStorage.saveUserPreferences.mockRejectedValue(
      new Error(errorMessage),
    );

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      try {
        await result.current.savePreferences(mockPreferences);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should update service enabled state', async () => {
    const initialPreferences: UserPreferences = {
      services: {
        chatgpt: { enabled: false },
      },
    };

    mockChromeStorage.getUserPreferences.mockResolvedValue(initialPreferences);
    mockChromeStorage.saveUserPreferences.mockResolvedValue();

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.updateServiceEnabled('chatgpt', true);
    });

    expect(mockChromeStorage.saveUserPreferences).toHaveBeenCalledWith({
      services: {
        chatgpt: { enabled: true },
      },
    });
  });

  it('should reload preferences', async () => {
    const mockPreferences: UserPreferences = {
      services: {
        claude: { enabled: true },
      },
    };

    mockChromeStorage.getUserPreferences
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockPreferences);

    const { result } = renderHook(() => useStorage());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.preferences).toBeNull();

    await act(async () => {
      await result.current.reload();
    });

    expect(result.current.preferences).toEqual(mockPreferences);
  });
});
