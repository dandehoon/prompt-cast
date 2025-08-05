import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteCard } from '../SiteCard';
import { EnhancedSite } from '../../../types';

describe('SiteCard', () => {
  const mockOnFocusTab = jest.fn();

  const baseSite: EnhancedSite = {
    id: 'chatgpt',
    name: 'ChatGPT',
    enabled: true,
    status: 'disconnected',
    url: 'https://chatgpt.com/',
    color: '#10a37f',
    colors: { light: '#10a37f', dark: '#10a37f' },
    hostPatterns: ['chatgpt.com'],
    inputSelectors: ['#prompt-textarea'],
    submitSelectors: ['[data-testid="send-button"]'],
  };

  const defaultProps = {
    site: baseSite,
    onFocusTab: mockOnFocusTab,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render site information', () => {
    render(<SiteCard {...defaultProps} />);

    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
  });

  it('should have default cursor when disabled', () => {
    const disabledSite = { ...baseSite, enabled: false };
    const { container } = render(<SiteCard {...defaultProps} site={disabledSite} />);

    const card = container.querySelector('.site-card');
    expect(card).toHaveClass('cursor-default');
  });

  it('should have pointer cursor when enabled (regardless of connection status)', () => {
    const { container } = render(<SiteCard {...defaultProps} />);

    const card = container.querySelector('.site-card');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should call onFocusTab when clicking enabled site card (regardless of status)', async () => {
    const user = userEvent.setup();
    const { container } = render(<SiteCard {...defaultProps} />);

    const card = container.querySelector('.site-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should call onFocusTab when clicking enabled and connected site card', async () => {
    const user = userEvent.setup();
    const connectedSite = { ...baseSite, status: 'connected' as const };
    const { container } = render(<SiteCard {...defaultProps} site={connectedSite} />);

    const card = container.querySelector('.site-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should call onFocusTab when clicking enabled but loading site card', async () => {
    const user = userEvent.setup();
    const loadingSite = { ...baseSite, status: 'loading' as const };
    const { container } = render(<SiteCard {...defaultProps} site={loadingSite} />);

    const card = container.querySelector('.site-card');
    await user.click(card!);

    expect(mockOnFocusTab).toHaveBeenCalledWith('chatgpt');
  });

  it('should not call onFocusTab when clicking disabled site card', async () => {
    const user = userEvent.setup();
    const disabledSite = { ...baseSite, enabled: false };
    const { container } = render(<SiteCard {...defaultProps} site={disabledSite} />);

    const card = container.querySelector('.site-card');
    await user.click(card!);

    expect(mockOnFocusTab).not.toHaveBeenCalled();
  });

  it('should display status indicator dot', () => {
    const { container } = render(<SiteCard {...defaultProps} />);

    const statusDot = container.querySelector('.w-2.h-2.rounded-full');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show green status dot for connected site', () => {
    const connectedSite = { ...baseSite, status: 'connected' as const };
    const { container } = render(<SiteCard {...defaultProps} site={connectedSite} />);

    const statusDot = container.querySelector('.bg-ai-success');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show yellow status dot for loading site', () => {
    const loadingSite = { ...baseSite, status: 'loading' as const };
    const { container } = render(<SiteCard {...defaultProps} site={loadingSite} />);

    const statusDot = container.querySelector('.bg-ai-warning');
    expect(statusDot).toBeInTheDocument();
  });

  it('should show gray status dot for disconnected site', () => {
    const { container } = render(<SiteCard {...defaultProps} />);

    const statusDot = container.querySelector('.bg-ai-text-disabled');
    expect(statusDot).toBeInTheDocument();
  });
});
