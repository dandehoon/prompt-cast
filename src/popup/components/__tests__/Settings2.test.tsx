import React from 'react';
import { render, screen } from '@testing-library/react';
import { Settings } from '../Settings';
import { THEME_OPTIONS } from '../../../shared/constants';

describe('Settings', () => {
  const mockOnServiceToggle = jest.fn();
  const mockOnThemeChange = jest.fn();

  const mockThemeOptions = [
    { value: THEME_OPTIONS.AUTO, label: 'Auto' },
    { value: THEME_OPTIONS.LIGHT, label: 'Light' },
    { value: THEME_OPTIONS.DARK, label: 'Dark' },
  ];

  const defaultProps = {
    services: {},
    onServiceToggle: mockOnServiceToggle,
    currentTheme: THEME_OPTIONS.AUTO,
    themeOptions: mockThemeOptions,
    onThemeChange: mockOnThemeChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render settings with theme selector', () => {
    render(<Settings {...defaultProps} />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
  });
});
