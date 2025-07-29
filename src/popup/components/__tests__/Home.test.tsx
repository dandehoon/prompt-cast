import React from 'react';
import { render, screen } from '@testing-library/react';
import { Home } from '../Home';
import { AIService, AIServiceId, ToastMessage } from '../../../shared/types';

// Mock child components
jest.mock('../AIServicesSection', () => ({
  AIServicesSection: jest.fn(({ services, onFocusTab, onCloseAllTabs, closeAllLoading }) => (
    <div data-testid="ai-services-section">
      <div data-testid="services-data">{JSON.stringify(services)}</div>
      <div data-testid="close-all-loading">{closeAllLoading.toString()}</div>
      <button onClick={() => onFocusTab('chatgpt')}>Focus Service</button>
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

  const mockServices: Record<AIServiceId, AIService> = {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      url: 'https://chat.openai.com',
      enabled: true,
      status: 'connected',
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai',
      enabled: false,
      status: 'disconnected',
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      url: 'https://gemini.google.com',
      enabled: true,
      status: 'loading',
    },
    grok: {
      id: 'grok',
      name: 'Grok',
      url: 'https://x.com/i/grok',
      enabled: false,
      status: 'error',
    },
  };

  const mockToasts: ToastMessage[] = [
    { id: '1', message: 'Test toast', type: 'success' },
  ];

  const defaultProps = {
    services: mockServices,
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

  it('should render AIServicesSection with correct props', () => {
    render(<Home {...defaultProps} />);

    expect(screen.getByTestId('ai-services-section')).toBeInTheDocument();
    expect(screen.getByTestId('close-all-loading')).toHaveTextContent('false');

    // Services should be passed as-is (no filtering in Home component)
    const servicesData = JSON.parse(screen.getByTestId('services-data').textContent || '{}');
    expect(servicesData).toHaveProperty('chatgpt');
    expect(servicesData).toHaveProperty('claude');
    expect(servicesData).toHaveProperty('gemini');
    expect(servicesData).toHaveProperty('grok');
  });

  it('should render MessageSection with correct props', () => {
    render(<Home {...defaultProps} />);

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
      <Home
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
    render(<Home {...defaultProps} message="" />);

    expect(screen.getByTestId('message-value')).toHaveTextContent('');
  });

  it('should pass empty toasts array', () => {
    render(<Home {...defaultProps} toasts={[]} />);

    expect(screen.getByTestId('toasts-count')).toHaveTextContent('0');
  });

  it('should handle different counts', () => {
    render(
      <Home
        {...defaultProps}
        connectedCount={1}
        enabledCount={3}
      />,
    );

    expect(screen.getByTestId('connected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('enabled-count')).toHaveTextContent('3');
  });

  it('should pass services unchanged to AIServicesSection', () => {
    const customServices = {
      ...mockServices,
      chatgpt: {
        ...mockServices.chatgpt,
        status: 'error' as const,
      },
    };

    render(<Home {...defaultProps} services={customServices} />);

    const servicesData = JSON.parse(screen.getByTestId('services-data').textContent || '{}');
    expect(servicesData.chatgpt.status).toBe('error');
  });
});
