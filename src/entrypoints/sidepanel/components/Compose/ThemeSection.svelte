<script lang="ts">
  import type { ThemeOption } from '@/types';
  import {
    theme,
    themeOptions,
    themeActions,
  } from '../../stores/themeStore';

  let currentTheme = $derived($theme as ThemeOption);
  let availableThemeOptions = $derived(themeOptions);
</script>

<section class="space-y-3">
  <header class="flex items-center justify-between">
    <h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
      Theme
    </h2>
  </header>

  <div class="grid grid-cols-3 gap-2">
    {#each availableThemeOptions as themeOption (themeOption.value)}
      <button
        class="p-2 text-xs rounded-md transition-colors"
        class:active={currentTheme === themeOption.value}
        onclick={() => themeActions.setTheme(themeOption.value)}
        style="background-color: {currentTheme === themeOption.value
          ? 'var(--pc-accent)'
          : 'var(--pc-bg-card)'}; color: {currentTheme === themeOption.value
          ? 'var(--pc-text-inverted)'
          : 'var(--pc-text-primary)'};"
      >
        {themeOption.label}
      </button>
    {/each}
  </div>
</section>

<style>
  button:hover:not(.active) {
    background-color: var(--pc-bg-hover);
  }
</style>
