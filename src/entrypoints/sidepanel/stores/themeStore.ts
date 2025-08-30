import { writable, derived } from 'svelte/store';
import type { ThemeOption } from '@/types';
import { logger } from '@/shared';

// Theme storage keys
const THEME_STORAGE_KEY = 'prompt-cast-theme';

// Available theme options with labels
export const themeOptions: Array<{ value: ThemeOption; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'System' },
];

// Internal theme store
const theme = writable<ThemeOption>('auto');

// Derived store for resolved theme (handles system preference)
export const resolvedTheme = derived(
  theme,
  ($theme, set) => {
    if ($theme === 'auto') {
      // Check system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateTheme = () => set(mediaQuery.matches ? 'dark' : 'light');

        // Set initial value
        updateTheme();

        // Listen for changes
        mediaQuery.addEventListener('change', updateTheme);

        // Cleanup function
        return () => mediaQuery.removeEventListener('change', updateTheme);
      }
      set('light'); // fallback
    } else {
      set($theme);
    }
  },
  'light', // initial value
);

// Initialize theme from storage
const initTheme = async () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        theme.set(savedTheme as ThemeOption);
      }
    }
  } catch (error) {
    logger.warn('Failed to load theme from storage:', error);
  }
};

// Theme actions
export const themeActions = {
  setTheme: async (newTheme: ThemeOption) => {
    try {
      theme.set(newTheme);

      // Save to storage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    } catch (error) {
      logger.error('Failed to save theme to storage:', error);
    }
  },

  getTheme: () => {
    // This function is not needed in Svelte stores since we can subscribe directly
    // but keeping for API compatibility
    let currentTheme: ThemeOption;
    const unsubscribe = theme.subscribe((value) => (currentTheme = value));
    unsubscribe();
    return currentTheme!;
  },

  getCurrentThemeOption: (): { value: ThemeOption; label: string } => {
    const currentTheme = themeActions.getTheme();
    return (
      themeOptions.find((option) => option.value === currentTheme) ||
      themeOptions[0]
    );
  },
};

// Export the theme store for reactive subscriptions
export { theme };

// Auto-initialize theme on import
initTheme();

// Listen for system theme changes when using 'auto' theme
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', () => {
    // Force reactivity update when system theme changes
    theme.update((t) => t);
  });
}
