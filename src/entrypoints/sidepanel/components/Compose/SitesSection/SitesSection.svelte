<script lang="ts">
  import SiteCard from './SiteCard.svelte';
  import ThemeSelector from '../Theme/ThemeSelector.svelte';
  import type { EnhancedSite } from '@/types';
  import { sitesWithStatus } from '../../../stores/siteStore';
  import {
    resolvedTheme,
    theme,
    themeActions,
  } from '../../../stores/themeStore';

  // Get all sites from store instead of props (not just enabled ones)
  const sites = $derived.by(() => {
    const sitesWithStatusFn = $sitesWithStatus as (
      isDark?: boolean,
    ) => Record<string, EnhancedSite>;
    const isDark = $resolvedTheme === 'dark';
    return sitesWithStatusFn(isDark);
  });

  // Get all sites as array for display
  const allSites = $derived(Object.values(sites));

  // Theme options for the selector
  const themeOptions = [
    { value: 'auto' as const, label: 'Auto' },
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
  ];

  function handleThemeChange(selectedTheme: 'auto' | 'light' | 'dark') {
    themeActions.setTheme(selectedTheme);
  }
</script>

<section class="space-y-3" id="sites-section">
  <header class="flex items-center justify-between">
    <h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
      Sites
    </h2>
    <ThemeSelector
      currentTheme={$theme}
      {themeOptions}
      onThemeChange={handleThemeChange}
    />
  </header>
  <div class="grid grid-cols-1 gap-2">
    {#each allSites as site (site.id)}
      <SiteCard {site} />
    {/each}
  </div>
</section>
