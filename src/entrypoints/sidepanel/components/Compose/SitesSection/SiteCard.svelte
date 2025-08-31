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

  function handleCardClick(event: MouseEvent | KeyboardEvent) {
    // Don't trigger if clicking on the toggle
    const target = event.target as HTMLElement;
    if (
      (target as HTMLInputElement).type === 'checkbox' ||
      target.closest('label')
    ) {
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
    <!-- Drag Handle -->
    <div
      class="drag-handle flex-shrink-0 mr-2 p-1"
      aria-label="Drag to reorder"
    >
      <svg
        width="8"
        height="16"
        viewBox="0 0 8 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="2" cy="3" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="3" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="2" cy="8" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="8" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="2" cy="13" r="1" fill="currentColor" opacity="0.4" />
        <circle cx="6" cy="13" r="1" fill="currentColor" opacity="0.4" />
      </svg>
    </div>

    <div class="flex items-center space-x-3 min-w-0 flex-1">
      <div
        class="w-4 h-4 rounded-full site-logo flex-shrink-0"
        style="background-color: {site.color};"
      ></div>
      <span class="text-sm font-medium pc-text-primary truncate flex-1"
        >{site.name}</span
      >
      <div
        class="w-2 h-2 rounded-full flex-shrink-0 {statusColor} self-center"
      ></div>
    </div>

    <div class="relative inline-flex items-center flex-shrink-0 ml-3">
      <input
        type="checkbox"
        class="sr-only peer"
        checked={site.enabled}
        id="site-checkbox-{site.id}"
        onchange={handleToggle}
        aria-label="Toggle {site.name}"
      />
      <label
        id="site-toggle-{site.id}"
        for="site-checkbox-{site.id}"
        class="cursor-pointer block w-11 h-6 rounded-full peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all"
        style="background-color: {site.enabled
          ? 'var(--pc-success)'
          : 'var(--pc-border)'};"
      ></label>
    </div>
  </div>
</div>

<style>
  .pc-card:hover {
    background-color: var(--pc-bg-hover);
  }

  .drag-handle {
    color: var(--pc-text-secondary);
    cursor: grab;
    opacity: 0.6;
    transition: opacity 0.2s ease;
  }

  .drag-handle:hover {
    opacity: 1;
  }

  .pc-card:hover .drag-handle {
    opacity: 0.8;
  }

  label:hover {
    transform: scale(1.05);
  }

  .peer:checked + label::after {
    background-color: var(--pc-text-inverted);
  }

  .peer:not(:checked) + label::after {
    background-color: var(--pc-text-inverted);
  }
</style>
