import { renderHook, act } from '@testing-library/react';
import { useTabOperations } from '../useTabOperations';
import { ChromeMessaging } from '../../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../../shared/constants';
import { CONFIG } from '../../../shared/config';
import { AIServiceId } from '../../../shared/types';

// Mock Chrome messaging
jest.mock('../../../shared/messaging');
const mockChromeMessaging = ChromeMessaging as jest.Mocked<
  typeof ChromeMessaging
>;

describe('useTabOperations', () => {
  const mockToggleService = jest.fn();
  const mockUpdateServiceEnabled = jest.fn();
  const mockRefreshServiceStates = jest.fn();
  const mockShowToast = jest.fn();

  const mockServices = {
    chatgpt: {
      id: 'chatgpt' as AIServiceId,
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      enabled: true,
      status: 'connected' as const,
    },
    claude: {
      id: 'claude' as AIServiceId,
      name: 'Claude',
      url: 'https://claude.ai',
      enabled: false,
      status: 'disconnected' as const,
    },
    gemini: {
      id: 'gemini' as AIServiceId,
      name: 'Gemini',
      url: 'https://gemini.google.com',
      enabled: false,
      status: 'disconnected' as const,
    },
    grok: {
      id: 'grok' as AIServiceId,
      name: 'Grok',
      url: 'https://x.com/i/grok',
      enabled: false,
      status: 'disconnected' as const,
    },
  };

  const defaultProps = {
    services: mockServices,
    toggleService: mockToggleService,
    updateServiceEnabled: mockUpdateServiceEnabled,
    refreshServiceStates: mockRefreshServiceStates,
    showToast: mockShowToast,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateServiceEnabled.mockResolvedValue(undefined);
    mockRefreshServiceStates.mockResolvedValue(undefined);
  });

  it('should toggle service enabled state', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleServiceToggle('chatgpt', false);
    });

    expect(mockToggleService).toHaveBeenCalledWith('chatgpt', false);
    expect(mockUpdateServiceEnabled).toHaveBeenCalledWith('chatgpt', false);
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.SERVICE_TOGGLE,
      payload: { serviceId: 'chatgpt', enabled: false },
    });
    expect(mockShowToast).toHaveBeenCalledWith('ChatGPT disabled', 'info');
  });

  it('should handle service toggle error and revert state', async () => {
    mockUpdateServiceEnabled.mockRejectedValue(new Error('Storage error'));
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleServiceToggle('claude', true);
    });

    expect(mockToggleService).toHaveBeenCalledWith('claude', true);
    expect(mockToggleService).toHaveBeenCalledWith('claude', false); // Revert call
    expect(mockShowToast).toHaveBeenCalledWith(
      'Failed to update service',
      'error',
    );
  });

  it('should handle focus tab for connected service', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleFocusTab('chatgpt');
    });

    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB,
      payload: { serviceId: 'chatgpt' },
    });
    expect(mockShowToast).toHaveBeenCalledWith('Switched to ChatGPT', 'info');
    expect(mockRefreshServiceStates).toHaveBeenCalled();
  });

  it('should handle focus tab for disconnected service', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleFocusTab('claude');
    });

    expect(mockShowToast).toHaveBeenCalledWith('Opening Claude...', 'info');
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB,
      payload: { serviceId: 'claude' },
    });
    expect(mockRefreshServiceStates).toHaveBeenCalled();
  });

  it('should handle focus tab error', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({
      success: false,
      error: 'Failed to focus tab',
    });
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleFocusTab('chatgpt');
    });

    expect(mockShowToast).toHaveBeenCalledWith('Failed to focus tab', 'error');
    expect(mockRefreshServiceStates).not.toHaveBeenCalled();
  });

  it('should close all tabs successfully', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleCloseAllTabs();
    });

    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.CLOSE_ALL_TABS,
    });
    expect(mockShowToast).toHaveBeenCalledWith('All AI tabs closed', 'info');
    expect(mockRefreshServiceStates).toHaveBeenCalled();
  });

  it('should handle close all tabs error', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({
      success: false,
      error: 'Failed to close tabs',
    });

    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleCloseAllTabs();
    });

    expect(mockShowToast).toHaveBeenCalledWith('Failed to close tabs', 'error');
  });

  it('should manage loading state for close all tabs', async () => {
    mockChromeMessaging.sendMessage.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), CONFIG.test.asyncDelay),
        ),
    );

    const { result } = renderHook(() => useTabOperations(defaultProps));

    expect(result.current.closeAllLoading).toBe(false);

    act(() => {
      result.current.handleCloseAllTabs();
    });

    // Loading should be true during execution
    expect(result.current.closeAllLoading).toBe(true);

    // Wait for promise to resolve
    await act(async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.test.integrationDelay),
      );
    });

    // Loading should be false after completion
    expect(result.current.closeAllLoading).toBe(false);
  });
});
