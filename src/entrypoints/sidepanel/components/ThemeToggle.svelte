<script lang="ts">
  import { theme, themeActions } from '../stores/themeStore';

  const currentTheme = $derived($theme);

  function selectTheme(selectedTheme: 'auto' | 'light' | 'dark') {
    themeActions.setTheme(selectedTheme);
  }
</script>

<div class="flex items-center gap-2">
  <button
    onclick={() => selectTheme('auto')}
    class="w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center {currentTheme === 'auto'
      ? 'ring-2 ring-blue-500 ring-offset-1'
      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'}"
    style="background: linear-gradient(45deg, #fbbf24 50%, #1f2937 50%);"
    title="Auto theme"
    aria-label="Auto theme"
  >
  </button>

  <button
    onclick={() => selectTheme('light')}
    class="w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center {currentTheme === 'light'
      ? 'ring-2 ring-yellow-400 ring-offset-1'
      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'}"
    style="background-color: #fbbf24;"
    title="Light theme"
    aria-label="Light theme"
  >
  </button>

  <button
    onclick={() => selectTheme('dark')}
    class="w-5 h-5 rounded-full transition-all cursor-pointer flex items-center justify-center {currentTheme === 'dark'
      ? 'ring-2 ring-gray-800 ring-offset-1'
      : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'}"
    style="background-color: #1f2937;"
    title="Dark theme"
    aria-label="Dark theme"
  >
  </button>
</div>

<style>
  button:hover {
    background-color: var(--pc-bg-hover);
  }
</style>
