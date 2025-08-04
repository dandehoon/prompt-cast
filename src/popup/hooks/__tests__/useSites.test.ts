import { renderHook, act } from '@testing-library/react';
import { useSites } from '../useSites';
import { useSiteUIStore } from '../../stores/siteUIStore';
import { useTheme } from '../useTheme';
import { ChromeMessaging } from '../../../shared/messaging';

// Mock the dependencies
jest.mock('../../stores/siteUIStore');
jest.mock('../useTheme');
jest.mock('../../../shared/messaging');

const mockUseSiteUIStore = useSiteUIStore as jest.MockedFunction<
  typeof useSiteUIStore
>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;
const mockChromeMessaging = ChromeMessaging as jest.Mocked<
  typeof ChromeMessaging
>;

describe('useSites', () => {
  const mockStoreActions = {
    getAllSitesWithStatus: jest.fn(),
    getEnabledSites: jest.fn(),
    getEnabledCount: jest.fn(),
    getConnectedCount: jest.fn(),
    updateSiteStatus: jest.fn(),
    toggleSite: jest.fn(),
    refreshSiteStates: jest.fn(),
    syncConfigsToBackground: jest.fn(),
  };

  const mockSites = {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chatgpt.com/',
      enabled: true,
      status: 'connected' as const,
      color: '#14ba91',
      hostPatterns: ['chatgpt.com'],
      inputSelectors: ['div#prompt-textarea'],
      submitSelectors: ['button#composer-submit-button'],
      colors: { light: '#14ba91', dark: '#10a37f' },
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai/',
      enabled: true,
      status: 'disconnected' as const,
      color: '#cc785c',
      hostPatterns: ['claude.ai'],
      inputSelectors: ['div[contenteditable]'],
      submitSelectors: ['button[aria-label="Send message"]'],
      colors: { light: '#cc785c', dark: '#cc785c' },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock theme hook
    mockUseTheme.mockReturnValue({
      resolvedTheme: 'light',
      currentTheme: 'light',
      systemTheme: 'light',
      changeTheme: jest.fn(),
      themeOptions: [],
    });

    // Mock store hook
    mockUseSiteUIStore.mockReturnValue({
      ...mockStoreActions,
      getAllSitesWithStatus: jest.fn().mockReturnValue(mockSites),
      getEnabledSites: jest.fn().mockReturnValue(['chatgpt', 'claude']),
      getEnabledCount: jest.fn().mockReturnValue(2),
      getConnectedCount: jest.fn().mockReturnValue(1),
    });

    // Mock Chrome messaging
    mockChromeMessaging.queryTabs.mockResolvedValue([]);
  });

  it('should initialize with sites from store', () => {
    const { result } = renderHook(() => useSites());

    expect(result.current.sites).toEqual(mockSites);
    expect(result.current.getEnabledSites()).toEqual(['chatgpt', 'claude']);
    expect(result.current.getEnabledCount()).toBe(2);
    expect(result.current.getConnectedCount()).toBe(1);
  });

  it('should toggle site enabled state', () => {
    const { result } = renderHook(() => useSites());

    act(() => {
      result.current.toggleSite('chatgpt', false);
    });

    expect(mockStoreActions.toggleSite).toHaveBeenCalledWith('chatgpt', false);
  });

  it('should refresh site states from tabs', async () => {
    const mockTabs = [
      {
        url: 'https://chatgpt.com/chat',
        id: 1,
        index: 0,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: true,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
        incognito: false,
      },
      {
        url: 'https://example.com',
        id: 2,
        index: 1,
        pinned: false,
        highlighted: false,
        windowId: 1,
        active: false,
        selected: false,
        discarded: false,
        autoDiscardable: true,
        groupId: -1,
        incognito: false,
      },
    ];
    mockChromeMessaging.queryTabs.mockResolvedValue(mockTabs);

    const { result } = renderHook(() => useSites());

    await act(async () => {
      await result.current.refreshSiteStates();
    });

    // Should update status for sites with matching tabs
    expect(mockStoreActions.updateSiteStatus).toHaveBeenCalledWith(
      'chatgpt',
      'connected',
    );
  });

  it('should handle refresh error gracefully', async () => {
    mockChromeMessaging.queryTabs.mockRejectedValue(
      new Error('Tab query failed'),
    );

    const { result } = renderHook(() => useSites());

    await act(async () => {
      await result.current.refreshSiteStates();
    });

    // Should fall back to store's refresh method
    expect(mockStoreActions.refreshSiteStates).toHaveBeenCalled();
  });
});
