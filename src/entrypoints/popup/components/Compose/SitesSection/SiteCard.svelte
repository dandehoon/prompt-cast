<script lang="ts">
  import { SITE_STATUS } from '@/shared';
  import type { EnhancedSite } from '@/types';
  import { tabOperationsActions } from '../../../stores/tabOperationsStore';

  interface Props {
    site: EnhancedSite;
  }

  let { site }: Props = $props();

  function handleCardClick() {
    // Focus the site tab if enabled (regardless of connection status)
    if (site.enabled) {
      tabOperationsActions.focusTab(site.id, site.name);
    }
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
  class="pc-card p-3 h-12 pc-transition {cursorStyle}"
  onclick={handleCardClick}
  onkeypress={(e) => e.key === 'Enter' && handleCardClick()}
  role="button"
  tabindex="0"
>
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-2">
      <div
        class="w-4 h-4 rounded-full site-logo"
        style="background-color: {site.color};"
      ></div>
      <span class="text-sm font-medium pc-text-primary">{site.name}</span>
    </div>
    <div class="w-2 h-2 rounded-full flex-shrink-0 {statusColor}"></div>
  </div>
</div>

<style>
  .pc-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--pc-shadow-md);
  }
</style>
