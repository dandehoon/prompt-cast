<script lang="ts">
  import SiteCard from './SiteCard.svelte';
  import type { EnhancedSite } from '@/types';
  import { sitesWithStatus } from '../../../stores/siteStore';
  import { resolvedTheme } from '../../../stores/themeStore';

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
</script>

<section class="space-y-3" id="sites-section">
  <header class="flex items-center justify-between">
    <h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
      Sites
    </h2>
  </header>
  <div class="grid grid-cols-1 gap-2">
    {#each allSites as site (site.id)}
      <SiteCard {site} />
    {/each}
  </div>
</section>
