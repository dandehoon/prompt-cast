import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceCard } from '../ServiceCard';
import { AIService } from '../../../shared/types';

describe('ServiceCard', () => {
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
    onFocusTab: mockOnFocusTab,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render service information', () => {
    render(<ServiceCard {...defaultProps} />);

    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
  });

  it('should have default cursor when disabled', () => {
    const disabledService = { ...baseService, enabled: false };
    const { container } = render(<ServiceCard {...defaultProps} service={disabledService} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('cursor-default');
  });

  it('should have pointer cursor when enabled (regardless of connection status)', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should call onFocusTab when clicking enabled service card (regardless of status)', async () => {
    const user = userEvent.setup();
    const { container } = render(<ServiceCard {...defaultProps} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should call onFocusTab when clicking enabled and connected service card', async () => {
    const user = userEvent.setup();
    const connectedService = { ...baseService, status: 'connected' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={connectedService} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should call onFocusTab when clicking enabled but loading service card', async () => {
    const user = userEvent.setup();
    const loadingService = { ...baseService, status: 'loading' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={loadingService} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should not call onFocusTab when clicking disabled service card', async () => {
    const user = userEvent.setup();
    const disabledService = { ...baseService, enabled: false };
    const { container } = render(<ServiceCard {...defaultProps} service={disabledService} />);

    const card = container.querySelector('.service-card');
    await user.click(card!);

    expect(mockOnFocusTab).not.toHaveBeenCalled();
  });

  it('should display status indicator dot', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const statusDot = container.querySelector('.w-2.h-2.rounded-full');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show green status dot for connected service', () => {
    const connectedService = { ...baseService, status: 'connected' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={connectedService} />);

    const statusDot = container.querySelector('.bg-ai-success');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show yellow status dot for loading service', () => {
    const loadingService = { ...baseService, status: 'loading' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={loadingService} />);

    const statusDot = container.querySelector('.bg-ai-warning');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show gray status dot for disconnected service', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const statusDot = container.querySelector('.bg-ai-text-disabled');
    expect(statusDot).toBeInTheDocument();
  });
});
