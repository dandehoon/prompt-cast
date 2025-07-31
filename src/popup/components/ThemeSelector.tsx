import React from 'react';
import { ThemeOption, THEME_OPTIONS } from '../../shared/constants';

interface ThemeOptionItem {
  value: ThemeOption;
  label: string;
}

interface ThemeSelectorProps {
  currentTheme: ThemeOption;
  themeOptions: ThemeOptionItem[];
  onThemeChange: (theme: ThemeOption) => void;
}

export function ThemeSelector({ currentTheme, themeOptions, onThemeChange }: ThemeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-ai-text-primary">Appearance</h3>
      <div className="space-y-2">
        {themeOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-ai-bg-hover transition-colors"
          >
            <div className="relative">
              <input
                type="radio"
                name="theme"
                value={option.value}
                checked={currentTheme === option.value}
                onChange={() => onThemeChange(option.value)}
                className="sr-only"
                aria-label={option.label}
              />
              <div className={`w-4 h-4 border-2 rounded-full transition-all ${currentTheme === option.value
                ? 'border-ai-accent bg-ai-accent'
                : 'border-ai-border'
                }`}>
                {currentTheme === option.value && (
                  <div className="w-2 h-2 bg-ai-text-inverted rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-ai-text-primary">{option.label}</span>
            </div>
            {/* Theme preview icon */}
            <div className="flex items-center space-x-1">
              {option.value === THEME_OPTIONS.LIGHT && (
                <div className="w-5 h-5 rounded-full bg-ai-warning border border-ai-border"></div>
              )}
              {option.value === THEME_OPTIONS.DARK && (
                <div className="w-5 h-5 rounded-full bg-ai-text-disabled border border-ai-border"></div>
              )}
              {option.value === THEME_OPTIONS.AUTO && (
                <div className="flex">
                  <div className="w-2.5 h-5 rounded-l-full bg-ai-warning border-l border-t border-b border-ai-border"></div>
                  <div className="w-2.5 h-5 rounded-r-full bg-ai-text-disabled border-r border-t border-b border-ai-border"></div>
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
