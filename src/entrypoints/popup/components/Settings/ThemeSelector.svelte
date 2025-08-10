<script lang="ts">
  import { THEME_OPTIONS } from '@/shared';
  import type { ThemeOption } from '@/shared';

  interface ThemeOptionItem {
    value: ThemeOption;
    label: string;
  }

  interface Props {
    currentTheme: ThemeOption;
    themeOptions: ThemeOptionItem[];
    onThemeChange: (theme: ThemeOption) => void;
  }

  let { currentTheme, themeOptions, onThemeChange }: Props = $props();
</script>

<section class="space-y-2">
  <header class="flex items-center justify-between">
    <h3 class="text-sm font-medium pc-text-primary">Appearance</h3>
    <div class="flex items-center space-x-2">
      {#each themeOptions as option (option.value)}
        <button
          type="button"
          onclick={() => onThemeChange(option.value)}
          class="p-1 rounded pc-transition cursor-pointer"
          class:theme-option-selected={currentTheme === option.value}
          title={option.label}
        >
          <!-- Theme preview icon -->
          {#if option.value === THEME_OPTIONS.LIGHT}
            <div
              class="w-4 h-4 rounded-full border-2 transition-all theme-icon-light"
              class:theme-selected={currentTheme === option.value}
            ></div>
          {:else if option.value === THEME_OPTIONS.DARK}
            <div
              class="w-4 h-4 rounded-full border-2 transition-all theme-icon-dark"
              class:theme-selected={currentTheme === option.value}
            ></div>
          {:else if option.value === THEME_OPTIONS.AUTO}
            <div
              class="w-4 h-4 rounded-full border-2 transition-all overflow-hidden flex"
              class:theme-selected={currentTheme === option.value}
            >
              <div class="w-2 h-4 theme-icon-light"></div>
              <div class="w-2 h-4 theme-icon-dark"></div>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </header>
</section>

<style>
  button:hover {
    background-color: var(--pc-bg-hover);
  }

  .theme-option-selected {
    background-color: var(--pc-accent-light);
  }

  .theme-option-selected:hover {
    background-color: var(--pc-accent-light);
  }

  /* Only custom styles that Tailwind can't provide */
  .theme-icon-light {
    background-color: #fbbf24;
    border-color: var(--pc-border);
  }

  .theme-icon-dark {
    background-color: #374151;
    border-color: var(--pc-border);
  }

  .theme-selected {
    border-color: var(--pc-accent) !important;
  }
</style>
