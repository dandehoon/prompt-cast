<script lang="ts">
  import { SITE_STATUS } from '@/shared';
  import type { EnhancedSite } from '@/types';
  import { tabOperationsActions } from '../../../stores/tabOperationsStore';
  import { siteActions } from '../../../stores/siteStore';
  import { toastActions } from '../../../stores/toastStore';

  interface Props {
    site: EnhancedSite;
  }

  let { site }: Props = $props();

  function handleCardClick(event: MouseEvent) {
    // Don't trigger if clicking on the toggle
    const target = event.target as HTMLElement;
    if (target.type === 'checkbox' || target.closest('label')) {
      return;
    }

    // Focus the site tab if enabled
    if (site.enabled) {
      tabOperationsActions.focusTab(site.id, site.name);
    }
  }

  async function handleToggle(event: Event) {
    const target = event.target as HTMLInputElement;
    await siteActions.toggleSite(site.id, target.checked);
    toastActions.showToast(
      `${target.checked ? 'Enabled' : 'Disabled'} ${site.name}`,
      'info',
    );
  }

  const cursorStyle = $derived(
    site.enabled ? 'cursor-pointer' : 'cursor-default',
  );
  const statusColor = $derived(
    site.status === SITE_STATUS.CONNECTED
      ? 'pc-status-connected'
      : site.status === SITE_STATUS.LOADING
        ? 'pc-status-loading'
        : site.status === SITE_STATUS.ERROR
          ? 'pc-status-error'
          : 'pc-status-disconnected',
  );
</script>

<div
  class="pc-card p-3 h-14 pc-transition {cursorStyle}"
  onclick={handleCardClick}
  onkeypress={(e) => e.key === 'Enter' && handleCardClick(e)}
  role="button"
  tabindex="0"
  style="opacity: {site.enabled ? '1' : '0.6'};"
>
  <div class="flex items-center justify-between h-full">
    <div class="flex items-center space-x-3 min-w-0 flex-1">
      <div
        class="w-4 h-4 rounded-full site-logo flex-shrink-0"
        style="background-color: {site.color};"
      ></div>
      <span class="text-sm font-medium pc-text-primary truncate">{site.name}</span>
      <div class="w-2 h-2 rounded-full flex-shrink-0 {statusColor}"></div>
    </div>

    <label
      class="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-3"
      id="site-toggle-{site.id}"
      onclick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        class="sr-only peer"
        checked={site.enabled}
        id="site-checkbox-{site.id}"
        onchange={handleToggle}
      />
      <div
        class="w-11 h-6 rounded-full peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
        style="background-color: {site.enabled
          ? 'var(--pc-success)'
          : 'var(--pc-border)'};"
      ></div>
    </label>
  </div>
</div>

<style>
  .pc-card:hover {
    background-color: var(--pc-bg-hover);
  }

  label:hover {
    transform: scale(1.05);
  }

  .peer:checked + div::after {
    background-color: var(--pc-text-inverted);
  }

  .peer + div::after {
    background-color: var(--pc-text-primary);
  }
</style>
