import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '../AppHeader';

describe('AppHeader', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render both tabs', () => {
    render(
      <AppHeader
        activeTab="home"
        onTabChange={mockOnTabChange}
      />,
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should highlight active tab', () => {
    render(
      <AppHeader
        activeTab="home"
        onTabChange={mockOnTabChange}
      />,
    );

    const homeTab = screen.getByText('Home').closest('button');
    const settingsTab = screen.getByText('Settings').closest('button');

    expect(homeTab).toHaveClass('bg-ai-card', 'text-ai-text', 'border-b-2', 'border-blue-500');
    expect(settingsTab).toHaveClass('text-ai-text-secondary');
  });

  it('should highlight settings tab when active', () => {
    render(
      <AppHeader
        activeTab="settings"
        onTabChange={mockOnTabChange}
      />,
    );

    const homeTab = screen.getByText('Home').closest('button');
    const settingsTab = screen.getByText('Settings').closest('button');

    expect(settingsTab).toHaveClass('bg-ai-card', 'text-ai-text', 'border-b-2', 'border-blue-500');
    expect(homeTab).toHaveClass('text-ai-text-secondary');
  });

  it('should call onTabChange when home tab clicked', async () => {
    const user = userEvent.setup();
    render(
      <AppHeader
        activeTab="settings"
        onTabChange={mockOnTabChange}
      />,
    );

    const homeTab = screen.getByText('Home');
    await user.click(homeTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('home');
  });

  it('should call onTabChange when settings tab clicked', async () => {
    const user = userEvent.setup();
    render(
      <AppHeader
        activeTab="home"
        onTabChange={mockOnTabChange}
      />,
    );

    const settingsTab = screen.getByText('Settings');
    await user.click(settingsTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('settings');
  });

  it('should have no focus outline on tab buttons', () => {
    render(
      <AppHeader
        activeTab="home"
        onTabChange={mockOnTabChange}
      />,
    );

    const homeTab = screen.getByText('Home').closest('button');
    expect(homeTab).toHaveClass('focus:outline-none', 'focus:ring-0');
  });
});
