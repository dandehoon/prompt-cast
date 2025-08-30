<script lang="ts">
  import ThemeSelector from './ThemeSelector.svelte';
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

  // Handle site toggle
  function handleSiteToggle(siteId: string, enabled: boolean) {
    siteActions.toggleSite(siteId, enabled);
    toastActions.showToast(
      `${enabled ? 'Enabled' : 'Disabled'} ${sites[siteId]?.name}`,
      'info',
    );
  }
</script>

<div class="space-y-6">
  <!-- Site Settings -->
  <section class="space-y-4">
    <header class="flex items-center justify-between">
      <h3 class="text-base font-medium pc-text-primary">Sites</h3>
      <div class="w-6 h-6"></div>
    </header>

    <div class="space-y-3">
      {#if $isLoadingSites}
        <div class="flex items-center justify-center p-4">
          <div class="text-sm pc-text-secondary">Loading sites...</div>
        </div>
      {:else}
        {#each siteValues as site (site.id)}
          <article
            class="flex items-center justify-between p-4 h-16 rounded-lg pc-card"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-6 h-6 rounded-full"
                style="background-color: {site.color};"
              ></div>
              <span class="text-base font-medium pc-text-primary"
                >{site.name}</span
              >
            </div>

            <label
              class="relative inline-flex items-center cursor-pointer flex-shrink-0"
              id="site-toggle-{site.id}"
            >
              <input
                type="checkbox"
                class="sr-only peer"
                checked={site.enabled}
                id="site-checkbox-{site.id}"
                onchange={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleSiteToggle(site.id, target.checked);
                }}
              />
              <div
                class="w-11 h-6 rounded-full peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
                style="background-color: {site.enabled
                  ? 'var(--pc-success)'
                  : 'var(--pc-border)'}; --after-bg: {site.enabled
                  ? 'var(--pc-text-inverted)'
                  : 'var(--pc-text-primary)'};"
              ></div>
            </label>
          </article>
        {/each}
      {/if}
    </div>
  </section>

  <!-- Theme Settings -->
  <section id="theme-settings">
    <ThemeSelector
      {currentTheme}
      themeOptions={availableThemeOptions}
      onThemeChange={themeActions.setTheme}
    />
  </section>
</div>

<style>
  .peer:checked + div::after {
    background-color: var(--after-bg);
  }

  .peer + div::after {
    background-color: var(--after-bg);
  }
</style>
