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

// Mock sleep function
jest.mock('../../../shared/utils', () => ({
  sleep: jest.fn(() => Promise.resolve()),
}));

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
    // Health check passes, but actual send fails
    mockChromeMessaging.sendMessage
      .mockResolvedValueOnce({ success: true }) // Health check
      .mockResolvedValue({
        success: false,
        error: 'Network error',
      });

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith('Network error', 'error');
  });

  it('should retry on recoverable errors', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt']);
    mockChromeMessaging.sendMessage
      .mockResolvedValueOnce({ success: true }) // Health check 1
      .mockResolvedValueOnce({
        success: false,
        error: 'Extension context invalidated',
      }) // Send fails
      .mockResolvedValueOnce({ success: true }) // Health check 2 (retry)
      .mockResolvedValueOnce({ success: true }); // Send succeeds

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(true);
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledTimes(4);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Send failed, retrying... (1/2)',
      'info',
    );
  });

  it('should check background health before sending', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt']);
    mockChromeMessaging.sendMessage
      .mockResolvedValueOnce({ success: true }) // Health check
      .mockResolvedValueOnce({ success: true }); // Actual send

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(true);
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockChromeMessaging.sendMessage).toHaveBeenNthCalledWith(1, {
      type: EXTENSION_MESSAGE_TYPES.GET_SITE_CONFIGS,
      payload: {},
    });
  });

  it('should retry when background is unhealthy', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt']);
    mockChromeMessaging.sendMessage
      .mockResolvedValueOnce({ success: false }) // First health check fails
      .mockResolvedValueOnce({ success: true }) // Second health check passes
      .mockResolvedValueOnce({ success: true }); // Actual send

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    const success = await act(async () => {
      return result.current.handleSendMessage('test message');
    });

    expect(success).toBe(true);
    expect(mockChromeMessaging.sendMessage).toHaveBeenCalledTimes(3);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Service not ready, retrying...',
      'info',
    );
  });

  it('should manage loading state correctly', async () => {
    mockGetEnabledSites.mockReturnValue(['chatgpt']);

    let resolveHealthCheck: (value: { success: boolean }) => void;
    let resolveSendMessage: (value: { success: boolean }) => void;

    const healthCheckPromise = new Promise<{ success: boolean }>((resolve) => {
      resolveHealthCheck = resolve;
    });

    const sendMessagePromise = new Promise<{ success: boolean }>((resolve) => {
      resolveSendMessage = resolve;
    });

    mockChromeMessaging.sendMessage
      .mockImplementationOnce(() => healthCheckPromise) // Health check
      .mockImplementationOnce(() => sendMessagePromise); // Send message

    const { result } = renderHook(() => useMessageHandler(defaultProps));

    expect(result.current.sendLoading).toBe(false);

    // Start the send process
    act(() => {
      result.current.handleSendMessage('test message');
    });

    // Loading should be true during execution
    expect(result.current.sendLoading).toBe(true);

    // Resolve health check
    await act(async () => {
      resolveHealthCheck!({ success: true });
      await sleep(50);
    });

    // Still loading because send message hasn't resolved
    expect(result.current.sendLoading).toBe(true);

    // Resolve send message
    await act(async () => {
      resolveSendMessage!({ success: true });
      await sleep(50);
    });

    // Loading should be false after completion
    expect(result.current.sendLoading).toBe(false);
  });

  it('should expose health check method', () => {
    const { result } = renderHook(() => useMessageHandler(defaultProps));

    expect(typeof result.current.checkBackgroundHealth).toBe('function');
  });
});
