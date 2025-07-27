import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCard } from '../ServiceCard';
import { AIService } from '../../../shared/types';

describe('ServiceCard', () => {
  const mockOnToggle = jest.fn();
  const mockOnCloseTab = jest.fn();
  const mockOnFocusTab = jest.fn();

  const baseService: AIService = {
    id: 'chatgpt',
    name: 'ChatGPT',
    enabled: true,
    status: 'disconnected',
    url: 'https://chatgpt.com/',
  };

  const defaultProps = {
    service: baseService,
    onToggle: mockOnToggle,
    onCloseTab: mockOnCloseTab,
    onFocusTab: mockOnFocusTab,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render service information', () => {
    render(<ServiceCard {...defaultProps} />);

    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument(); // Close button
  });

  it('should show disconnected status with gray indicator', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toHaveClass('bg-gray-500');
  });

  it('should show connected status with green indicator', () => {
    const connectedService = { ...baseService, status: 'connected' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={connectedService} />);

    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toHaveClass('bg-green-500');
  });

  it('should show loading status with yellow indicator', () => {
    const loadingService = { ...baseService, status: 'loading' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={loadingService} />);

    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toHaveClass('bg-yellow-500');
    expect(statusIndicator).toHaveClass('animate-pulse');
  });

  it('should show error status with red indicator', () => {
    const errorService = { ...baseService, status: 'error' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={errorService} />);

    const statusIndicator = container.querySelector('.status-indicator');
    expect(statusIndicator).toHaveClass('bg-red-500');
  });

  it('should be enabled by default', () => {
    render(<ServiceCard {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should show disabled state', () => {
    const disabledService = { ...baseService, enabled: false };
    render(<ServiceCard {...defaultProps} service={disabledService} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should have reduced opacity when disabled', () => {
    const disabledService = { ...baseService, enabled: false };
    const { container } = render(<ServiceCard {...defaultProps} service={disabledService} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('opacity-50');
  });

  it('should have full opacity when enabled', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('opacity-100');
  });

  it('should call onToggle when checkbox clicked', async () => {
    const user = userEvent.setup();
    render(<ServiceCard {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith('chatgpt', false);
  });

  it('should call onToggle when enabling disabled service', async () => {
    const user = userEvent.setup();
    const disabledService = { ...baseService, enabled: false };
    render(<ServiceCard {...defaultProps} service={disabledService} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith('chatgpt', true);
  });

  it('should call onFocusTab when card is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ServiceCard {...defaultProps} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should call onCloseTab when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ServiceCard {...defaultProps} />);

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnCloseTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should not call onFocusTab when clicking on toggle', async () => {
    const user = userEvent.setup();
    render(<ServiceCard {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnFocusTab).not.toHaveBeenCalled();
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('should not call onFocusTab when clicking on close button', async () => {
    const user = userEvent.setup();
    render(<ServiceCard {...defaultProps} />);

    const closeButton = screen.getByText('×');
    await user.click(closeButton);

    expect(mockOnFocusTab).not.toHaveBeenCalled();
    expect(mockOnCloseTab).toHaveBeenCalled();
  });
});
