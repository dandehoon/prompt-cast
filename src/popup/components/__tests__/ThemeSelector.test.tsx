import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '../ThemeSelector';
import { THEME_OPTIONS } from '../../../shared/constants';

describe('ThemeSelector', () => {
  const mockOnThemeChange = jest.fn();

  const mockThemeOptions = [
    { value: THEME_OPTIONS.AUTO, label: 'Auto' },
    { value: THEME_OPTIONS.LIGHT, label: 'Light' },
    { value: THEME_OPTIONS.DARK, label: 'Dark' },
  ];

  const defaultProps = {
    currentTheme: THEME_OPTIONS.AUTO,
    themeOptions: mockThemeOptions,
    onThemeChange: mockOnThemeChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render theme selector with title', () => {
    render(<ThemeSelector {...defaultProps} />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('should render all theme options', () => {
    render(<ThemeSelector {...defaultProps} />);

    expect(screen.getByText('Auto')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('should show current theme as selected', () => {
    render(
      <ThemeSelector
        {...defaultProps}
        currentTheme={THEME_OPTIONS.DARK}
      />,
    );

    const radios = screen.getAllByRole('radio');
    const darkRadio = radios.find(radio => radio.getAttribute('aria-label') === 'Dark');

    expect(darkRadio).toBeChecked();
  });

  it('should show auto theme icon', () => {
    render(<ThemeSelector {...defaultProps} />);

    // Check that auto theme has the split light/dark preview icon
    const { container } = render(<ThemeSelector {...defaultProps} />);
    expect(container.querySelector('.bg-ai-warning')).toBeInTheDocument();
    expect(container.querySelector('.bg-ai-text-disabled')).toBeInTheDocument();
  });

  it.skip('should call onThemeChange when option is clicked', () => {
    const mockOnThemeChange = jest.fn();

    render(
      <ThemeSelector
        currentTheme={THEME_OPTIONS.AUTO}
        themeOptions={mockThemeOptions}
        onThemeChange={mockOnThemeChange}
      />,
    );

    // Find the light theme label and click it
    const lightLabel = screen.getByText('Light').closest('label');

    if (lightLabel) {
      fireEvent.click(lightLabel);
      expect(mockOnThemeChange).toHaveBeenCalledWith(THEME_OPTIONS.LIGHT);
    }
  });

  it('should render theme preview icons', () => {
    const { container } = render(<ThemeSelector {...defaultProps} />);

    // Should have theme preview backgrounds
    expect(container.querySelector('.bg-ai-warning')).toBeInTheDocument();
    expect(container.querySelector('.bg-ai-text-disabled')).toBeInTheDocument();
  });

  it('should highlight selected option with accent color', () => {
    const { container } = render(
      <ThemeSelector
        {...defaultProps}
        currentTheme={THEME_OPTIONS.LIGHT}
      />,
    );

    expect(container.querySelector('.border-ai-accent')).toBeInTheDocument();
    expect(container.querySelector('.bg-ai-accent')).toBeInTheDocument();
  });
});
