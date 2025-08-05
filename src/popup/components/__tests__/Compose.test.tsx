import React from 'react';
import { render, screen } from '@testing-library/react';
import { Compose } from '../Compose';
import { EnhancedSite, ToastMessage } from '../../../types';

// Mock child components
jest.mock('../SitesSection', () => ({
  SitesSection: jest.fn(({ sites, onFocusTab, onCloseAllTabs, closeAllLoading }) => (
    <div data-testid="sites-section">
      <div data-testid="sites-data">{JSON.stringify(sites)}</div>
      <div data-testid="close-all-loading">{closeAllLoading.toString()}</div>
      <button onClick={() => onFocusTab('chatgpt')}>Focus Site</button>
      <button onClick={onCloseAllTabs}>Close All</button>
    </div>
  )),
}));

jest.mock('../MessageSection', () => ({
  MessageSection: jest.fn(({
    message,
    onMessageChange,
    onSend,
    sendLoading,
    toasts,
    isLoading,
    connectedCount,
    enabledCount,
  }) => (
    <div data-testid="message-section">
      <div data-testid="message-value">{message}</div>
      <div data-testid="send-loading">{sendLoading.toString()}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="connected-count">{connectedCount}</div>
      <div data-testid="enabled-count">{enabledCount}</div>
      <div data-testid="toasts-count">{toasts.length}</div>
      <button onClick={() => onMessageChange('test message')}>Change Message</button>
      <button onClick={onSend}>Send</button>
    </div>
  )),
}));

describe('Home', () => {
  const mockOnFocusTab = jest.fn();
  const mockOnCloseAllTabs = jest.fn();
  const mockOnMessageChange = jest.fn();
  const mockOnSend = jest.fn();
  const mockMessageInputRef = { current: null } as React.RefObject<HTMLTextAreaElement>;

  const mockSites: Record<string, EnhancedSite> = {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      enabled: true,
      status: 'connected',
      color: '#10a37f',
      colors: { light: '#10a37f', dark: '#10a37f' },
      hostPatterns: ['chat.openai.com'],
      inputSelectors: ['#prompt-textarea'],
      submitSelectors: ['[data-testid="send-button"]'],
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      enabled: false,
      status: 'disconnected',
      color: '#cc785c',
      colors: { light: '#cc785c', dark: '#cc785c' },
      hostPatterns: ['claude.ai'],
      inputSelectors: ['div[contenteditable]'],
      submitSelectors: ['button[aria-label="Send message"]'],
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      url: 'https://gemini.google.com',
      enabled: true,
      status: 'loading',
      color: '#4285f4',
      colors: { light: '#4285f4', dark: '#4285f4' },
      hostPatterns: ['gemini.google.com'],
      inputSelectors: ['div.ql-editor'],
      submitSelectors: ['button.send-button'],
    },
    grok: {
      id: 'grok',
      name: 'Grok',
      url: 'https://x.com/i/grok',
      enabled: false,
      status: 'error',
      color: '#5d5d5d',
      colors: { light: '#5d5d5d', dark: '#7d7d7d' },
      hostPatterns: ['x.com'],
      inputSelectors: ['textarea[dir="auto"]'],
      submitSelectors: ['form button[type="submit"]'],
    },
  };

  const mockToasts: ToastMessage[] = [
    { id: '1', message: 'Test toast', type: 'success' },
  ];

  const defaultProps = {
    sites: mockSites,
    onFocusTab: mockOnFocusTab,
    onCloseAllTabs: mockOnCloseAllTabs,
    closeAllLoading: false,
    message: 'test message',
    onMessageChange: mockOnMessageChange,
    onSend: mockOnSend,
    sendLoading: false,
    messageInputRef: mockMessageInputRef,
    toasts: mockToasts,
    isLoading: false,
    connectedCount: 2,
    enabledCount: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render SitesSection with correct props', () => {
    render(<Compose {...defaultProps} />);

    expect(screen.getByTestId('sites-section')).toBeInTheDocument();
    expect(screen.getByTestId('close-all-loading')).toHaveTextContent('false');

    // Sites should be passed as-is (no filtering in Home component)
    const sitesData = JSON.parse(screen.getByTestId('sites-data').textContent || '{}');
    expect(sitesData).toHaveProperty('chatgpt');
    expect(sitesData).toHaveProperty('claude');
    expect(sitesData).toHaveProperty('gemini');
    expect(sitesData).toHaveProperty('grok');
  });

  it('should render MessageSection with correct props', () => {
    render(<Compose {...defaultProps} />);

    expect(screen.getByTestId('message-section')).toBeInTheDocument();
    expect(screen.getByTestId('message-value')).toHaveTextContent('test message');
    expect(screen.getByTestId('send-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('connected-count')).toHaveTextContent('2');
    expect(screen.getByTestId('enabled-count')).toHaveTextContent('2');
    expect(screen.getByTestId('toasts-count')).toHaveTextContent('1');
  });

  it('should pass loading states correctly', () => {
    render(
      <Compose
        {...defaultProps}
        closeAllLoading={true}
        sendLoading={true}
        isLoading={true}
      />,
    );

    expect(screen.getByTestId('close-all-loading')).toHaveTextContent('true');
    expect(screen.getByTestId('send-loading')).toHaveTextContent('true');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
  });

  it('should handle empty message', () => {
    render(<Compose {...defaultProps} message="" />);

    expect(screen.getByTestId('message-value')).toHaveTextContent('');
  });

  it('should pass empty toasts array', () => {
    render(<Compose {...defaultProps} toasts={[]} />);

    expect(screen.getByTestId('toasts-count')).toHaveTextContent('0');
  });

  it('should handle different counts', () => {
    render(
      <Compose
        {...defaultProps}
        connectedCount={1}
        enabledCount={3}
      />,
    );

    expect(screen.getByTestId('connected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('enabled-count')).toHaveTextContent('3');
  });

  it('should pass sites unchanged to SitesSection', () => {
    const customSites = {
      ...mockSites,
      chatgpt: {
        ...mockSites.chatgpt,
        status: 'error' as const,
      },
    };

    render(<Compose {...defaultProps} sites={customSites} />);

    const sitesData = JSON.parse(screen.getByTestId('sites-data').textContent || '{}');
    expect(sitesData.chatgpt.status).toBe('error');
  });
});
