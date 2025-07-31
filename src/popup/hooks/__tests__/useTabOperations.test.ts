import { renderHook, act } from '@testing-library/react';
import { useTabOperations } from '../useTabOperations';
import { ChromeMessaging } from '../../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../../shared/constants';
import { CONFIG } from '../../../shared/config';

// Mock Chrome messaging
jest.mock('../../../shared/messaging');
const mockChromeMessaging = ChromeMessaging as jest.Mocked<
  typeof ChromeMessaging
>;

describe('useTabOperations', () => {
  const mockToggleSite = jest.fn();
  const mockUpdateSiteEnabled = jest.fn();
  const mockRefreshSiteStates = jest.fn();
  const mockShowToast = jest.fn();

  const mockSites = {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      enabled: true,
      status: 'connected' as const,
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      enabled: false,
      status: 'disconnected' as const,
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      url: 'https://gemini.google.com',
      enabled: false,
      status: 'disconnected' as const,
    },
    grok: {
      id: 'grok',
      name: 'Grok',
      url: 'https://x.com/i/grok',
      enabled: false,
      status: 'disconnected' as const,
    },
  };

  const defaultProps = {
    sites: mockSites,
    toggleSite: mockToggleSite,
    updateSiteEnabled: mockUpdateSiteEnabled,
    refreshSiteStates: mockRefreshSiteStates,
    showToast: mockShowToast,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSiteEnabled.mockResolvedValue(undefined);
    mockRefreshSiteStates.mockResolvedValue(undefined);
  });

  it('should toggle site enabled state', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleSiteToggle('chatgpt', false);
    });

    expect(mockToggleSite).toHaveBeenCalledWith('chatgpt', false);
    expect(mockUpdateSiteEnabled).toHaveBeenCalledWith('chatgpt', false);
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.SITE_TOGGLE,
      payload: { siteId: 'chatgpt', enabled: false },
    });
    expect(mockShowToast).toHaveBeenCalledWith('ChatGPT disabled', 'info');
  });

  it('should handle site toggle error and revert state', async () => {
    mockUpdateSiteEnabled.mockRejectedValue(new Error('Storage error'));
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleSiteToggle('claude', true);
    });

    expect(mockToggleSite).toHaveBeenCalledWith('claude', true);
    expect(mockToggleSite).toHaveBeenCalledWith('claude', false); // Revert call
    expect(mockShowToast).toHaveBeenCalledWith(
      'Failed to update site',
      'error',
    );
  });

  it('should handle focus tab for connected site', async () => {
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleFocusTab('chatgpt');
    });

    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB,
      payload: { siteId: 'chatgpt' },
    });
    expect(mockRefreshSiteStates).toHaveBeenCalled();
  });

  it('should handle focus tab for disabled site', async () => {
    const { result } = renderHook(() => useTabOperations(defaultProps));

    await act(async () => {
      result.current.handleFocusTab('claude');
    });

    expect(mockShowToast).toHaveBeenCalledWith('Claude is disabled', 'error');
    expect(mockChromeMessaging.sendMessage).not.toHaveBeenCalled();
    expect(mockRefreshSiteStates).not.toHaveBeenCalled();
  });

  it('should handle focus tab for enabled but disconnected site', async () => {
    // Create sites with an enabled but disconnected site
    const sitesWithEnabledDisconnected = {
      ...mockSites,
      claude: {
        ...mockSites.claude,
        enabled: true,
        status: 'disconnected' as const,
      },
    };

    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });
    const { result } = renderHook(() =>
      useTabOperations({
        ...defaultProps,
        sites: sitesWithEnabledDisconnected,
      }),
    );

    await act(async () => {
      result.current.handleFocusTab('claude');
    });

    expect(mockShowToast).toHaveBeenCalledWith('Opening Claude...', 'info');
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.FOCUS_TAB,
      payload: { siteId: 'claude' },
    });
    expect(mockRefreshSiteStates).toHaveBeenCalled();
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
    expect(mockRefreshSiteStates).not.toHaveBeenCalled();
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
    expect(mockRefreshSiteStates).toHaveBeenCalled();
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
