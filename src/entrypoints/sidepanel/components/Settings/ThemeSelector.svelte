<script lang="ts">
  import type { ThemeOption } from '@/types';

  interface Props {
    currentTheme: ThemeOption;
    themeOptions: Array<{ value: ThemeOption; label: string }>;
    onThemeChange: (theme: ThemeOption) => void;
  }

  let { currentTheme, themeOptions, onThemeChange }: Props = $props();

  function handleThemeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    onThemeChange(target.value as ThemeOption);
  }
</script>

<div class="theme-selector">
  <h3 class="text-lg font-semibold mb-3">Theme</h3>
  <div class="flex flex-col space-y-2">
    <label for="theme-select" class="text-sm text-gray-600 dark:text-gray-400">
      Choose your preferred theme
    </label>
    <select
      id="theme-select"
      value={currentTheme}
      onchange={handleThemeChange}
      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      {#each themeOptions as option (option.value)}
        <option value={option.value}>
          {option.label}
        </option>
      {/each}
    </select>
  </div>
</div>

<style>
  .theme-selector {
    padding: 1rem;
    background: var(--pc-surface);
    border-radius: 0.5rem;
    border: 1px solid var(--pc-border);
  }
</style>
