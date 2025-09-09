<script lang="ts">
  import { SITE_STATUS } from '@/shared';
  import type { EnhancedSite } from '@/types';
  import { tabOperationsActions } from '../../../stores/tabOperationsStore';
  import { siteActions } from '../../../stores/siteStore';
  import { toastActions } from '../../../stores/toastStore';
  import { activeTabStore } from '../../../stores/activeTabStore';

  interface Props {
    site: EnhancedSite;
  }

  let { site }: Props = $props();

  // Check if this site is the currently active tab
  const isActiveTab = $derived($activeTabStore === site.id);

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
</script>

<div
  class="pc-card p-3 h-14"
  class:cursor-pointer={site.enabled}
  class:active-tab={isActiveTab}
  class:site-disabled={!site.enabled}
  onclick={handleCardClick}
  onkeypress={(e) => e.key === 'Enter' && handleCardClick(e)}
  role="button"
  tabindex="0"
>
  <div class="flex items-center justify-between h-full">
    <!-- Drag Handle -->
    <div class="drag-handle flex-shrink-0 mr-2 p-1">
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
        class="w-2 h-2 rounded-full flex-shrink-0 self-center"
        class:pc-status-connected={site.status === SITE_STATUS.CONNECTED}
        class:pc-status-loading={site.status === SITE_STATUS.LOADING}
        class:pc-status-error={site.status === SITE_STATUS.ERROR}
        class:pc-status-disconnected={site.status === SITE_STATUS.DISCONNECTED}
      ></div>
    </div>

    <div class="relative inline-flex items-center flex-shrink-0 ml-3">
      <input
        type="checkbox"
        class="sr-only peer"
        checked={site.enabled}
        id="site-checkbox-{site.id}"
        onchange={handleToggle}
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
  /* Remove redundant hover style that conflicts with common.css */
  /* The .pc-card:hover style is already defined in common.css */

  .drag-handle {
    color: var(--pc-text-secondary);
    cursor: grab;
    opacity: 0.6;
    pointer-events: auto;
  }

  .drag-handle:hover,
  .pc-card:hover .drag-handle {
    opacity: 0.8;
  }

  /* Toggle switch styles */
  label {
    transition: transform 0.15s ease;
  }

  label:hover {
    transform: scale(1.02);
  }

  .peer:checked + label::after,
  .peer:not(:checked) + label::after {
    background-color: var(--pc-text-inverted);
  }

  .pc-card.site-disabled {
    opacity: 0.3;
  }

  .pc-card.active-tab {
    background-color: var(--pc-bg-active);
    border-color: var(--pc-text-disabled);
  }
</style>
