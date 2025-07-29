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

  it('should have default cursor when disabled or disconnected', () => {
    const disabledService = { ...baseService, enabled: false };
    const { container } = render(<ServiceCard {...defaultProps} service={disabledService} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('cursor-default');
  });

  it('should have pointer cursor when enabled and connected', () => {
    const connectedService = { ...baseService, status: 'connected' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={connectedService} />);

    const card = container.querySelector('.service-card');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should call onFocusTab when clicking enabled and connected service card', async () => {
    const user = userEvent.setup();
    const connectedService = { ...baseService, status: 'connected' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={connectedService} />);

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

  it('should not call onFocusTab when clicking disconnected service card', async () => {
    const user = userEvent.setup();
    const { container } = render(<ServiceCard {...defaultProps} />);

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

    const statusDot = container.querySelector('.bg-green-500');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show yellow status dot for loading service', () => {
    const loadingService = { ...baseService, status: 'loading' as const };
    const { container } = render(<ServiceCard {...defaultProps} service={loadingService} />);

    const statusDot = container.querySelector('.bg-yellow-500');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show gray status dot for disconnected service', () => {
    const { container } = render(<ServiceCard {...defaultProps} />);

    const statusDot = container.querySelector('.bg-gray-500');
    expect(statusDot).toBeInTheDocument();
  });
});
