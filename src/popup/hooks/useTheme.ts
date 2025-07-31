import { useState, useEffect, useCallback } from 'react';
import { THEME_OPTIONS, ThemeOption } from '../../shared/constants';
import { useStorage } from './useStorage';

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<ThemeOption>(
    THEME_OPTIONS.AUTO,
  );
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const { preferences, savePreferences } = useStorage();

  // Detect system theme preference
  const detectSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setSystemTheme(isDark ? 'dark' : 'light');
      return isDark ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Calculate resolved theme based on current theme setting
  const calculateResolvedTheme = useCallback(
    (theme: ThemeOption, system: 'light' | 'dark') => {
      switch (theme) {
        case THEME_OPTIONS.LIGHT:
          return 'light';
        case THEME_OPTIONS.DARK:
          return 'dark';
        case THEME_OPTIONS.AUTO:
        default:
          return system;
      }
    },
    [],
  );

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  // Change theme and persist to storage
  const changeTheme = useCallback(
    async (newTheme: ThemeOption) => {
      try {
        setCurrentTheme(newTheme);
        const resolved = calculateResolvedTheme(newTheme, systemTheme);
        setResolvedTheme(resolved);
        applyTheme(resolved);

        // Save to storage
        const currentPrefs = preferences || { services: {} };
        await savePreferences({
          ...currentPrefs,
          theme: newTheme,
        });
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    },
    [
      preferences,
      savePreferences,
      systemTheme,
      calculateResolvedTheme,
      applyTheme,
    ],
  );

  // Initialize theme from storage and system
  useEffect(() => {
    const system = detectSystemTheme();
    const savedTheme = preferences?.theme || THEME_OPTIONS.AUTO;

    setCurrentTheme(savedTheme);
    setSystemTheme(system);

    const resolved = calculateResolvedTheme(savedTheme, system);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [
    preferences?.theme,
    detectSystemTheme,
    calculateResolvedTheme,
    applyTheme,
  ]);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: { matches: boolean }) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        setSystemTheme(newSystemTheme);

        // Only update resolved theme if we're in auto mode
        if (currentTheme === THEME_OPTIONS.AUTO) {
          setResolvedTheme(newSystemTheme);
          applyTheme(newSystemTheme);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [currentTheme, applyTheme]);

  return {
    currentTheme,
    resolvedTheme,
    systemTheme,
    changeTheme,
    themeOptions: [
      { value: THEME_OPTIONS.AUTO, label: 'Auto' },
      { value: THEME_OPTIONS.LIGHT, label: 'Light' },
      { value: THEME_OPTIONS.DARK, label: 'Dark' },
    ],
  };
}
