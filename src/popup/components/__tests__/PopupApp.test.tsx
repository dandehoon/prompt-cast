import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopupApp } from '../PopupApp';

// Mock all hooks
jest.mock('../../hooks/useSites');
jest.mock('../../hooks/useStorage');
jest.mock('../../hooks/useToast');
jest.mock('../../hooks/useMessageHandler');
jest.mock('../../hooks/useTabOperations');
jest.mock('../../hooks/useTheme');

// Mock child components
jest.mock('../AppHeader', () => ({
  AppHeader: jest.fn(({ activeTab, onTabChange }) => (
    <div data-testid="app-header">
      <button onClick={() => onTabChange('home')}>Home</button>
      <button onClick={() => onTabChange('settings')}>Settings</button>
      <div data-testid="active-tab">{activeTab}</div>
    </div>
  )),
}));

jest.mock('../Compose', () => ({
  Compose: jest.fn(({ message, onMessageChange, onSend }) => (
    <div data-testid="compose">
      <input
        data-testid="message-input"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
      />
      <button data-testid="send-button" onClick={onSend}>
        Send
      </button>
    </div>
  )),
}));

jest.mock('../Settings', () => ({
  Settings: jest.fn(() => <div data-testid="settings">Settings</div>),
}));

import { useSites } from '../../hooks/useSites';
import { useStorage } from '../../hooks/useStorage';
import { useToast } from '../../hooks/useToast';
import { useMessageHandler } from '../../hooks/useMessageHandler';
import { useTabOperations } from '../../hooks/useTabOperations';
import { useTheme } from '../../hooks/useTheme';

const mockUseSites = useSites as jest.MockedFunction<typeof useSites>;
const mockUseStorage = useStorage as jest.MockedFunction<typeof useStorage>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseMessageHandler = useMessageHandler as jest.MockedFunction<typeof useMessageHandler>;
const mockUseTabOperations = useTabOperations as jest.MockedFunction<typeof useTabOperations>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('PopupApp', () => {
  const mockUpdateLastMessage = jest.fn();
  const mockHandleSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSites.mockReturnValue({
      sites: {},
      toggleSite: jest.fn(),
      refreshSiteStates: jest.fn(),
      getEnabledSites: jest.fn(),
      getConnectedCount: jest.fn().mockReturnValue(0),
      getEnabledCount: jest.fn().mockReturnValue(0),
    });

    mockUseStorage.mockReturnValue({
      preferences: null,
      loading: false,
      error: null,
      savePreferences: jest.fn(),
      updateSiteEnabled: jest.fn(),
      updateLastMessage: mockUpdateLastMessage,
      reload: jest.fn(),
    });

    mockUseToast.mockReturnValue({
      toasts: [],
      showToast: jest.fn(),
      removeToast: jest.fn(),
      clearToasts: jest.fn(),
    });

    mockUseMessageHandler.mockReturnValue({
      sendLoading: false,
      handleSendMessage: mockHandleSendMessage,
    });

    mockUseTabOperations.mockReturnValue({
      closeAllLoading: false,
      handleSiteToggle: jest.fn(),
      handleFocusTab: jest.fn(),
      handleCloseAllTabs: jest.fn(),
    });

    mockUseTheme.mockReturnValue({
      currentTheme: 'dark',
      resolvedTheme: 'dark',
      systemTheme: 'dark',
      themeOptions: [
        { value: 'auto', label: 'Auto' },
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
      changeTheme: jest.fn(),
    });
  });

  it('should auto-save message changes with debouncing', async () => {
    const user = userEvent.setup();
    render(<PopupApp />);

    const messageInput = screen.getByTestId('message-input');

    // Type a message
    await user.clear(messageInput);
    await user.type(messageInput, 'Hello world');

    // Wait for debounce (500ms)
    await waitFor(
      () => {
        expect(mockUpdateLastMessage).toHaveBeenCalledWith('Hello world');
      },
      { timeout: 1000 },
    );
  });

  it('should save empty string when message is cleared', async () => {
    const user = userEvent.setup();
    
    // Mock initial preferences with a saved message
    mockUseStorage.mockReturnValue({
      preferences: { sites: {}, lastMessage: 'Previous message' },
      loading: false,
      error: null,
      savePreferences: jest.fn(),
      updateSiteEnabled: jest.fn(),
      updateLastMessage: mockUpdateLastMessage,
      reload: jest.fn(),
    });

    render(<PopupApp />);

    const messageInput = screen.getByTestId('message-input');

    // Clear the input
    await user.clear(messageInput);

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockUpdateLastMessage).toHaveBeenCalledWith('');
      },
      { timeout: 1000 },
    );
  });

  it('should load saved message from storage on mount', () => {
    mockUseStorage.mockReturnValue({
      preferences: { sites: {}, lastMessage: 'Saved message' },
      loading: false,
      error: null,
      savePreferences: jest.fn(),
      updateSiteEnabled: jest.fn(),
      updateLastMessage: mockUpdateLastMessage,
      reload: jest.fn(),
    });

    render(<PopupApp />);

    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).toHaveValue('Saved message');
  });

  it('should clear message and storage after successful send', async () => {
    const user = userEvent.setup();
    mockHandleSendMessage.mockResolvedValue(true);

    render(<PopupApp />);

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Type a message
    await user.type(messageInput, 'Test message');
    
    // Send the message
    await user.click(sendButton);

    // Wait for async operations
    await waitFor(() => {
      expect(mockHandleSendMessage).toHaveBeenCalledWith('Test message');
    });

    // Should clear local state
    expect(messageInput).toHaveValue('');
    
    // Should clear storage
    expect(mockUpdateLastMessage).toHaveBeenCalledWith('');
  });

  it('should not clear message if send fails', async () => {
    const user = userEvent.setup();
    mockHandleSendMessage.mockResolvedValue(false);

    render(<PopupApp />);

    const messageInput = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Type a message
    await user.type(messageInput, 'Test message');
    
    // Send the message (will fail)
    await user.click(sendButton);

    // Wait for async operations
    await waitFor(() => {
      expect(mockHandleSendMessage).toHaveBeenCalledWith('Test message');
    });

    // Should keep the message
    expect(messageInput).toHaveValue('Test message');
    
    // Should not clear storage
    expect(mockUpdateLastMessage).not.toHaveBeenCalledWith('');
  });

  it('should handle empty preferences gracefully', () => {
    mockUseStorage.mockReturnValue({
      preferences: null,
      loading: false,
      error: null,
      savePreferences: jest.fn(),
      updateSiteEnabled: jest.fn(),
      updateLastMessage: mockUpdateLastMessage,
      reload: jest.fn(),
    });

    render(<PopupApp />);

    const messageInput = screen.getByTestId('message-input');
    expect(messageInput).toHaveValue('');
  });

  it('should switch between home and settings tabs', async () => {
    const user = userEvent.setup();
    render(<PopupApp />);

    // Should start on home tab
    expect(screen.getByTestId('compose')).toBeInTheDocument();
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();

    // Switch to settings
    await user.click(screen.getByText('Settings'));
    
    expect(screen.queryByTestId('compose')).not.toBeInTheDocument();
    expect(screen.getByTestId('settings')).toBeInTheDocument();

    // Switch back to home
    await user.click(screen.getByText('Home'));
    
    expect(screen.getByTestId('compose')).toBeInTheDocument();
    expect(screen.queryByTestId('settings')).not.toBeInTheDocument();
  });
});
