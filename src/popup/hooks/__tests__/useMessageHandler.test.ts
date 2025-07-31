import { renderHook, act } from '@testing-library/react';
import { useMessageHandler } from '../useMessageHandler';
import { ChromeMessaging } from '../../../shared/messaging';
import { EXTENSION_MESSAGE_TYPES } from '../../../shared/constants';
import { sleep } from '../../../shared/utils';

// Mock Chrome messaging
jest.mock('../../../shared/messaging');
const mockChromeMessaging = ChromeMessaging as jest.Mocked<
  typeof ChromeMessaging
>;

describe('useMessageHandler', () => {
  const mockGetEnabledSites = jest.fn();
  const mockRefreshSiteStates = jest.fn();
  const mockShowToast = jest.fn();

  const defaultProps = {
    getEnabledSites: mockGetEnabledSites,
    refreshSiteStates: mockRefreshSiteStates,
    showToast: mockShowToast,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle empty message', async () => {
    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('');
    });

    expect(success).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Please enter a message',
      'error',
    );
  });

  it('should handle no enabled sites', async () => {
    mockGetEnabledSites.mockReturnValue([]);

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Please enable at least one site',
      'error',
    );
  });

  it('should successfully send message', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt', 'claude']);
    mockChromeMessaging.sendMessage.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Preparing to send message...',
      'info',
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      'Message sent to 2 sites',
      'success',
    );
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledWith({
      type: EXTENSION_MESSAGE_TYPES.SEND_MESSAGE,
      payload: {
        message: 'test message',
        sites: ['chatgpt', 'claude'],
      },
    });
  });

  it('should handle send failure', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt']);
    mockChromeMessaging.sendMessage.mockResolvedValue({
      success: false,
      error: 'Network error',
    });

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Failed to send message',
      'error',
    );
  });

  it('should manage loading state correctly', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt']);
    mockChromeMessaging.sendMessage.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100),
        ),
    );

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    expect(result.current.sendLoading).toBe(false);

    act(() => {
      result.current.handleSendMessage('test message');
    });

    // Loading should be true during execution
    expect(result.current.sendLoading).toBe(true);

    // Wait for promise to resolve
    await act(async () => {
      await sleep(150);
    });

    // Loading should be false after completion
    expect(result.current.sendLoading).toBe(false);
  });
});
