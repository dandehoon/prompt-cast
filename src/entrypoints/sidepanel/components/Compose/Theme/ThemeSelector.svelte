<script lang="ts">
  import type { ThemeOption } from '@/types';

  interface Props {
    currentTheme: ThemeOption;
    themeOptions: Array<{ value: ThemeOption; label: string }>;
    onThemeChange: (theme: ThemeOption) => void;
  }

  let { currentTheme, themeOptions, onThemeChange }: Props = $props();

  function handleThemeCycle() {
    const currentIndex = themeOptions.findIndex(
      (opt) => opt.value === currentTheme,
    );
    const nextIndex = (currentIndex + 1) % themeOptions.length;
    onThemeChange(themeOptions[nextIndex].value);
  }

  const currentLabel = $derived(
    themeOptions.find((opt) => opt.value === currentTheme)?.label || 'Auto',
  );
</script>

<div class="theme-selector">
  <button
    onclick={handleThemeCycle}
    title={`Theme: ${currentLabel} (click to change)`}
    class="theme-btn"
  >
    {#if currentTheme === 'light'}
      <svg class="theme-icon" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clip-rule="evenodd"
        />
      </svg>
    {:else if currentTheme === 'dark'}
      <svg class="theme-icon" fill="currentColor" viewBox="0 0 20 20">
        <path
          d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
        />
      </svg>
    {:else if currentTheme === 'auto'}
      <svg class="theme-icon" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
          clip-rule="evenodd"
        />
      </svg>
    {/if}
  </button>
</div>

<style>
  .theme-selector {
    display: flex;
    gap: 0.25rem;
  }

  .theme-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0.25rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--pc-text-secondary);
    cursor: pointer;
    opacity: 0.6;
  }

  .theme-btn:hover {
    background: var(--pc-bg-hover);
    border-color: var(--pc-border);
    opacity: 0.8;
  }

  .theme-btn:active {
    transform: scale(0.9);
  }

  .theme-icon {
    width: 14px;
    height: 14px;
  }
</style>
