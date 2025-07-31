import { renderHook, act, waitFor } from '@testing-library/react';
import { useSites } from '../useSites';
import { ChromeMessaging } from '../../../shared/messaging';
import { logger } from '../../../shared/logger';

// Mock the ChromeMessaging module
jest.mock('../../../shared/messaging');

const mockChromeMessaging = ChromeMessaging as jest.Mocked<
  typeof ChromeMessaging
>;

describe('useSites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock to return empty tabs
    mockChromeMessaging.queryTabs.mockResolvedValue([]);
  });

  it('should initialize with default sites', async () => {
    const { result } = renderHook(() => useSites());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    expect(result.current.sites).toMatchObject({
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

  it('should refresh site states from tabs', async () => {
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

    const { result } = renderHook(() => useSites());

    await act(async () => {
      await result.current.refreshSiteStates();
    });

    expect(result.current.sites.chatgpt.status).toBe('connected');
    expect(result.current.sites.chatgpt.tabId).toBe(1);
    expect(result.current.sites.claude.status).toBe('connected');
    expect(result.current.sites.claude.tabId).toBe(2);
    expect(result.current.sites.gemini.status).toBe('disconnected');
    expect(result.current.sites.grok.status).toBe('disconnected');
  });

  it('should toggle site enabled state', async () => {
    const { result } = renderHook(() => useSites());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    act(() => {
      result.current.toggleSite('chatgpt', false);
    });

    expect(result.current.sites.chatgpt.enabled).toBe(false);

    act(() => {
      result.current.toggleSite('chatgpt', true);
    });

    expect(result.current.sites.chatgpt.enabled).toBe(true);
  });

  it('should get enabled sites', async () => {
    const { result } = renderHook(() => useSites());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    // Initially all sites are enabled
    expect(result.current.getEnabledSites()).toEqual([
      'chatgpt',
      'claude',
      'gemini',
      'grok',
    ]);

    act(() => {
      result.current.toggleSite('claude', false);
      result.current.toggleSite('grok', false);
    });

    expect(result.current.getEnabledSites()).toEqual(['chatgpt', 'gemini']);
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

    const { result } = renderHook(() => useSites());

    await act(async () => {
      await result.current.refreshSiteStates();
    });

    expect(result.current.getConnectedCount()).toBe(2);
  });

  it('should get enabled count', async () => {
    const { result } = renderHook(() => useSites());

    // Wait for the initial useEffect to complete
    await waitFor(() => {
      expect(mockChromeMessaging.queryTabs).toHaveBeenCalled();
    });

    expect(result.current.getEnabledCount()).toBe(4);

    act(() => {
      result.current.toggleSite('chatgpt', false);
    });

    expect(result.current.getEnabledCount()).toBe(3);
  });

  it('should handle refresh site states error', async () => {
    const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
    mockChromeMessaging.queryTabs.mockRejectedValue(new Error('Query failed'));

    renderHook(() => useSites());

    // Wait for the initial useEffect to complete (which will fail)
    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to refresh site states:',
        expect.any(Error),
      );
    });

    loggerSpy.mockRestore();
  });

  it('should handle site refresh gracefully', async () => {
    const loggerSpy = jest.spyOn(logger, 'error').mockImplementation();
    mockChromeMessaging.queryTabs.mockRejectedValueOnce(
      new Error('Test error'),
    );

    renderHook(() => useSites());

    await waitFor(() => {
      expect(loggerSpy).toHaveBeenCalledWith(
        'Failed to refresh site states:',
        expect.any(Error),
      );
    });

    loggerSpy.mockRestore();
  });
});
