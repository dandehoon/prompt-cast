import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCard } from '../ServiceCard';
import { AIService } from '../../../shared/types';

describe('ServiceCard', () => {
  const mockOnToggle = jest.fn();
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
    onFocusTab: mockOnFocusTab,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render service information', () => {
    render(<ServiceCard {...defaultProps} />);

    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
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

  it('should have reduced opacity when disconnected', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('opacity-50'); // disconnected state
  });

  it('should have full opacity when enabled and connected', () => {
    const connectedService = { ...baseService, status: 'connected' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={connectedService} />);

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

  it('should call onToggle when clicking disabled service card', async () => {
    const user = userEvent.setup();
    const disabledService = { ...baseService, enabled: false };
    const { container } = render(<ServiceCard {...defaultProps} service={disabledService} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnToggle).toHaveBeenCalledWith('chatgpt', true);
    expect(mockOnFocusTab).not.toHaveBeenCalled();
  });

  it('should call onFocusTab when clicking enabled service card', async () => {
    const user = userEvent.setup();
    const { container } = render(<ServiceCard {...defaultProps} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it('should not call onFocusTab when clicking on toggle', async () => {
    const user = userEvent.setup();
    render(<ServiceCard {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnFocusTab).not.toHaveBeenCalled();
    expect(mockOnToggle).toHaveBeenCalled();
  });
});
