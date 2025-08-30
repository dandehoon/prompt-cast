<script lang="ts">
  import type { EnhancedSite, ThemeOption } from '@/types';
  import {
    sitesWithStatus,
    siteActions,
    isLoadingSites,
  } from '../../stores/siteStore';
  import {
    theme,
    resolvedTheme,
    themeOptions,
    themeActions,
  } from '../../stores/themeStore';
  import { toastActions } from '../../stores/toastStore';

  // Get reactive store values
  let sites = $derived.by(() => {
    const sitesWithStatusFn = $sitesWithStatus as (
      isDark?: boolean,
    ) => Record<string, EnhancedSite>;
    const isDark = $resolvedTheme === 'dark';
    return sitesWithStatusFn(isDark);
  });

  let currentTheme = $derived($theme as ThemeOption);
  let availableThemeOptions = $derived(themeOptions);
  let siteValues = $derived(Object.values(sites));

  async function handleSiteToggle(siteId: string, enabled: boolean) {
    await siteActions.toggleSite(siteId, enabled);
    toastActions.showToast(
      `${enabled ? 'Enabled' : 'Disabled'} ${sites[siteId]?.name}`,
      'info',
    );
  }
</script>

<section class="space-y-3">
  <header class="flex items-center justify-between">
    <h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
      Settings
    </h2>
  </header>

  <div class="space-y-3">
    <!-- Site Settings - Compact -->
    <div class="space-y-2">
      <h3 class="text-xs font-medium text-opacity-75" style="color: var(--pc-text-secondary);">
        Enable Sites
      </h3>

      {#if $isLoadingSites}
        <div class="flex justify-center py-2">
          <div
            class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
            style="border-color: var(--pc-accent);"
          ></div>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-2">
          {#each siteValues as site (site.id)}
            <label
              class="flex items-center justify-between p-2 rounded-md pc-card cursor-pointer"
              id="site-toggle-{site.id}"
            >
              <div class="flex items-center space-x-2 min-w-0 flex-1">
                <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  style="background-color: {site.color};"
                ></div>
                <span class="text-xs font-medium pc-text-primary truncate"
                  >{site.name}</span
                >
              </div>

              <input
                type="checkbox"
                class="w-3 h-3 rounded border-2 focus:ring-0 focus:ring-offset-0 flex-shrink-0 ml-2"
                style="accent-color: var(--pc-accent);"
                checked={site.enabled}
                id="site-checkbox-{site.id}"
                onchange={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleSiteToggle(site.id, target.checked);
                }}
              />
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Theme Settings - Compact -->
    <div class="space-y-2">
      <h3 class="text-xs font-medium text-opacity-75" style="color: var(--pc-text-secondary);">
        Theme
      </h3>

      <div class="grid grid-cols-3 gap-1">
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
    </div>
  </div>
</section>

<style>
  button:hover:not(.active) {
    background-color: var(--pc-bg-hover);
  }

  label:hover {
    background-color: var(--pc-bg-hover);
  }
</style>
