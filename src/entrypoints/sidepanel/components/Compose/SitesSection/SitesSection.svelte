<script lang="ts">
  import SiteCard from './SiteCard.svelte';
  import type { EnhancedSite } from '@/types';
  import {
    tabOperationsStore,
    tabOperationsActions,
  } from '../../../stores/tabOperationsStore';
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

  // Get loading state from store
  const tabOpsState = $derived($tabOperationsStore);

  // Get all sites as array for display
  const allSites = $derived(Object.values(sites));
</script>

<section class="space-y-3" id="sites-section">
  <header class="flex items-center justify-between">
    <h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
      Sites
    </h2>
    <button
      id="close-all-tabs-button"
      onclick={tabOperationsActions.closeAllTabs}
      disabled={tabOpsState.closeAllLoading}
      class="p-1 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style="color: var(--pc-error);"
      title="Close All"
    >
      {#if tabOpsState.closeAllLoading}
        <div
          class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
          style="border-color: var(--pc-error);"
        ></div>
      {:else}
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      {/if}
    </button>
  </header>
  <div class="grid grid-cols-1 gap-2">
    {#each allSites as site (site.id)}
      <SiteCard {site} />
    {/each}
  </div>
</section>

<style>
  button:hover {
    background-color: var(--pc-error-light);
  }
</style>
