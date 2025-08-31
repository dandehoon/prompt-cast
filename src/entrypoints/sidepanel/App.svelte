<script lang="ts">
  import { onMount } from 'svelte';
  import Compose from './components/Compose/Compose.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import { siteActions } from './stores/siteStore';
  import { resolvedTheme } from './stores/themeStore';
  import './app.css';

  // Reactive theme application
  $effect(() => {
    if ($resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  // Initialize stores on mount
  onMount(() => {
    siteActions.refreshSiteStates();
  });
</script>

<div class="app pc-bg-primary pc-text-primary">
  <div class="flex flex-col h-full">
    <!-- Header with theme toggle -->
    <header class="p-4 pb-0 flex justify-between items-center">
      <h2 class="text-sm font-medium pc-text-primary">Theme</h2>
      <ThemeToggle />
    </header>

    <Compose />
  </div>
</div>
