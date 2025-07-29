import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '../Settings';
import { AIService } from '../../../shared/types';

describe('Settings', () => {
  const mockOnServiceToggle = jest.fn();

  const mockServices: Record<string, AIService> = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render settings title', () => {
    render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    expect(screen.getByText('AI Services Settings')).toBeInTheDocument();
  });

  it('should render all services', () => {
    render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.getByText('Grok')).toBeInTheDocument();
  });

  it('should show correct service status', () => {
    render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should show correct toggle states', () => {
    render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    const toggles = screen.getAllByRole('checkbox');
    expect(toggles).toHaveLength(4);

    // ChatGPT and Gemini should be enabled
    expect(toggles[0]).toBeChecked(); // ChatGPT
    expect(toggles[2]).toBeChecked(); // Gemini

    // Claude and Grok should be disabled
    expect(toggles[1]).not.toBeChecked(); // Claude
    expect(toggles[3]).not.toBeChecked(); // Grok
  });

  it('should call onServiceToggle when toggle clicked', async () => {
    const user = userEvent.setup();
    render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    const claudeToggle = screen.getAllByRole('checkbox')[1]; // Claude
    await user.click(claudeToggle);

    expect(mockOnServiceToggle).toHaveBeenCalledWith('claude', true);
  });

  it('should call onServiceToggle to disable enabled service', async () => {
    const user = userEvent.setup();
    render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    const chatgptToggle = screen.getAllByRole('checkbox')[0]; // ChatGPT
    await user.click(chatgptToggle);

    expect(mockOnServiceToggle).toHaveBeenCalledWith('chatgpt', false);
  });

  it('should show service logos with correct colors', () => {
    const { container } = render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    expect(container.querySelector('.bg-green-500')).toBeInTheDocument(); // ChatGPT
    expect(container.querySelector('.bg-orange-500')).toBeInTheDocument(); // Claude
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument(); // Gemini
    expect(container.querySelector('.bg-purple-500')).toBeInTheDocument(); // Grok
  });

  it('should show status colors correctly', () => {
    const { container } = render(
      <Settings
        services={mockServices}
        onServiceToggle={mockOnServiceToggle}
      />,
    );

    expect(container.querySelector('.text-green-500')).toBeInTheDocument(); // Connected
    expect(container.querySelector('.text-gray-500')).toBeInTheDocument(); // Disconnected
    expect(container.querySelector('.text-yellow-500')).toBeInTheDocument(); // Loading
    expect(container.querySelector('.text-red-500')).toBeInTheDocument(); // Error
  });
});
