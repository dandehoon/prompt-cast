<script lang="ts">
  import {
    orderedSites,
    getNextTab,
    getPreviousTab,
  } from '../../../stores/siteStore';
  import { tabOperationsActions } from '../../../stores/tabOperationsStore';
  import { activeSiteId } from '../../../stores/activeTabStore';
  import { resolvedTheme } from '../../../stores/themeStore';

  interface Props {
    onCloseAll?: () => void;
    closeAllLoading?: boolean;
  }

  let { onCloseAll, closeAllLoading = false }: Props = $props();

  // Navigation state and logic
  const currentActiveSiteId = $derived($activeSiteId);
  const isDark = $derived($resolvedTheme === 'dark');
  const enabledTabs = $derived(
    ($orderedSites as (isDark?: boolean) => import('@/types').EnhancedSite[])(
      isDark,
    ).filter((site) => site.enabled && site.hasTab),
  );
  const hasNavigationTabs = $derived(enabledTabs.length > 1);

  // Navigation functions
  const handleNavigatePrevious = () => {
    const previousTab = getPreviousTab(
      currentActiveSiteId || undefined,
      isDark,
    );
    if (previousTab && previousTab.isTabReady) {
      tabOperationsActions.focusTab(previousTab.id, previousTab.name);
    }
  };

  const handleNavigateNext = () => {
    const nextTab = getNextTab(currentActiveSiteId || undefined, isDark);
    if (nextTab && nextTab.isTabReady) {
      tabOperationsActions.focusTab(nextTab.id, nextTab.name);
    }
  };
</script>

<div class="actions-container">
  <!-- Previous Tab Button -->
  <button
    onclick={handleNavigatePrevious}
    disabled={!hasNavigationTabs}
    class="action-btn"
    title="Previous AI Tab"
    aria-label="Previous AI Tab"
  >
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
        clip-rule="evenodd"
      />
    </svg>
  </button>

  <!-- Next Tab Button -->
  <button
    onclick={handleNavigateNext}
    disabled={!hasNavigationTabs}
    class="action-btn"
    title="Next AI Tab"
    aria-label="Next AI Tab"
  >
    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path
        fill-rule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
  <!-- Close All Tabs Button -->
  <button
    id="close-all-tabs-button"
    onclick={onCloseAll}
    disabled={closeAllLoading}
    class="action-btn close-btn"
    title="Close AI Tabs"
    aria-label="Close AI Tabs"
  >
    {#if closeAllLoading}
      <div
        class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
        style:border-color="var(--pc-error)"
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
</div>

<style>
  .actions-container {
    display: flex;
    gap: 0.25rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0.25rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--pc-text-secondary);
    cursor: pointer;
    opacity: 0.6;
  }

  .action-btn:hover {
    background: var(--pc-bg-hover);
    border-color: var(--pc-border);
    opacity: 0.8;
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.9) !important;
    background: var(--pc-bg-active);
    border-color: var(--pc-border-hover);
  }

  .action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .action-btn:disabled:hover {
    background: transparent;
    border-color: transparent;
    opacity: 0.3;
  }

  .action-btn:disabled:active {
    transform: none;
  }
</style>
