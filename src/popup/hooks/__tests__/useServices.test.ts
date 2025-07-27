import { renderHook, act, waitFor } from '@testing-library/react';
import { useServices } from '../useServices';
import { ChromeMessaging } from '../../../shared/messaging';

// Mock the ChromeMessaging module
jest.mock('../../../shared/messaging');

const mockChromeMessaging = ChromeMessaging as jest.Mocked<
  typeof ChromeMessaging
>;

describe('useServices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock to return empty tabs
    mockChromeMessaging.queryTabs.mockResolvedValue([]);
  });

  it('should initialize with default services', async () => {
    const { result } = renderHook(() => useServices());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    expect(result.current.services).toMatchObject({
      chatgpt: {
        id: 'chatgpt',
        name: 'ChatGPT',
        enabled: true,
        status: 'disconnected',
      },
      claude: {
        id: 'claude',
        name: 'Claude',
        enabled: true,
        status: 'disconnected',
      },
      gemini: {
        id: 'gemini',
        name: 'Gemini',
        enabled: true,
        status: 'disconnected',
      },
      grok: {
        id: 'grok',
        name: 'Grok',
        enabled: true,
        status: 'disconnected',
      },
    });
  });

  it('should refresh service states from tabs', async () => {
    const mockTabs = [
      {
        id: 1,
        url: 'https://chatgpt.com/chat',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
      },
      {
        id: 2,
        url: 'https://claude.ai/chat',
        index: 1,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
      },
    ];

    mockChromeMessaging.queryTabs.mockResolvedValue(mockTabs);

    const { result } = renderHook(() => useServices());

    await act(async () => {
      await result.current.refreshServiceStates();
    });

    expect(result.current.services.chatgpt.status).toBe('connected');
    expect(result.current.services.chatgpt.tabId).toBe(1);
    expect(result.current.services.claude.status).toBe('connected');
    expect(result.current.services.claude.tabId).toBe(2);
    expect(result.current.services.gemini.status).toBe('disconnected');
    expect(result.current.services.grok.status).toBe('disconnected');
  });

  it('should toggle service enabled state', async () => {
    const { result } = renderHook(() => useServices());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    act(() => {
      result.current.toggleService('chatgpt', false);
    });

    expect(result.current.services.chatgpt.enabled).toBe(false);

    act(() => {
      result.current.toggleService('chatgpt', true);
    });

    expect(result.current.services.chatgpt.enabled).toBe(true);
  });

  it('should get enabled services', async () => {
    const { result } = renderHook(() => useServices());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    // Initially all services are enabled
    expect(result.current.getEnabledServices()).toEqual([
      'chatgpt',
      'claude',
      'gemini',
      'grok',
    ]);

    act(() => {
      result.current.toggleService('claude', false);
      result.current.toggleService('grok', false);
    });

    expect(result.current.getEnabledServices()).toEqual(['chatgpt', 'gemini']);
  });

  it('should get connected count', async () => {
    const mockTabs = [
      {
        id: 1,
        url: 'https://chatgpt.com/',
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
      },
      {
        id: 2,
        url: 'https://gemini.google.com/',
        index: 1,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        incognito: false,
        selected: false,
        discarded: false,
        autoDiscardable: false,
        groupId: -1,
      },
    ];

    mockChromeMessaging.queryTabs.mockResolvedValue(mockTabs);

    const { result } = renderHook(() => useServices());

    await act(async () => {
      await result.current.refreshServiceStates();
    });

    expect(result.current.getConnectedCount()).toBe(2);
  });

  it('should get enabled count', async () => {
    const { result } = renderHook(() => useServices());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    expect(result.current.getEnabledCount()).toBe(4);

    act(() => {
      result.current.toggleService('chatgpt', false);
    });

    expect(result.current.getEnabledCount()).toBe(3);
  });

  it('should handle refresh service states error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockChromeMessaging.queryTabs.mockRejectedValue(new Error('Query failed'));

    const { result } = renderHook(() => useServices());

    // Wait for the initial useEffect to complete (which will fail)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to refresh service states:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should handle service refresh gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockChromeMessaging.queryTabs.mockRejectedValueOnce(
      new Error('Test error')
    );

    renderHook(() => useServices());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to refresh service states:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
