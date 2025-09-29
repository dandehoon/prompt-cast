<script lang="ts">
  import SiteCard from './SiteCard.svelte';
  import ThemeSelector from '../Theme/ThemeSelector.svelte';
  import type { EnhancedSite } from '@/types';
  import { orderedSites } from '../../../stores/siteStore';
  import { siteActions } from '../../../stores/siteStore';
  import {
    resolvedTheme,
    theme,
    themeActions,
  } from '../../../stores/themeStore';

  let isTogglingAll = $state(false);

  // Get ordered sites from store
  const sites = $derived.by(() => {
    const orderedSitesFn = $orderedSites as (
      isDark?: boolean,
    ) => EnhancedSite[];
    const isDark = $resolvedTheme === 'dark';
    return orderedSitesFn(isDark);
  });

  // Drag and drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  // Theme options for the selector
  const themeOptions = [
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
    { value: 'auto' as const, label: 'Auto' },
  ];

  function handleThemeChange(selectedTheme: 'auto' | 'light' | 'dark') {
    themeActions.setTheme(selectedTheme);
  }

  async function handleEnableAll() {
    if (isTogglingAll) return;
    isTogglingAll = true;
    try {
      await siteActions.enableAllSites();
    } finally {
      isTogglingAll = false;
    }
  }

  async function handleDisableAll() {
    if (isTogglingAll) return;
    isTogglingAll = true;
    try {
      await siteActions.disableAllSites();
    } finally {
      isTogglingAll = false;
    }
  }

  // Utility function for resetting drag state
  function resetDragState() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  function handleDragStart(event: DragEvent, index: number) {
    if (!event.dataTransfer) return;

    draggedIndex = index;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }

  function handleDragEnd() {
    resetDragState();
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (
      draggedIndex !== null &&
      draggedIndex !== index &&
      dragOverIndex !== index
    ) {
      dragOverIndex = index;
    }
  }

  function handleDragLeave(event: DragEvent) {
    // Only reset drag over if we're leaving the container entirely
    const relatedTarget = event.relatedTarget as Element;
    const currentTarget = event.currentTarget as Element;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      dragOverIndex = null;
    }
  }
  // Utility function for calculating drop position
  function calculateInsertIndex(
    dragIndex: number,
    dropIndex: number,
    arrayLength: number,
  ): number {
    if (dropIndex >= arrayLength) {
      return arrayLength - 1; // Insert at the very end (after removal)
    }

    return dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
  }

  async function handleDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      resetDragState();
      return;
    }

    // Create new order array and get the dragged item
    const newOrder = [...sites];
    const draggedItem = newOrder[draggedIndex];

    // Remove the dragged item and calculate insert position
    newOrder.splice(draggedIndex, 1);
    const insertIndex = calculateInsertIndex(
      draggedIndex,
      dropIndex,
      sites.length,
    );

    // Insert at the calculated position and save
    newOrder.splice(insertIndex, 0, draggedItem);
    const siteIds = newOrder.map((site) => site.id);

    try {
      await siteActions.reorderSites(siteIds);
    } catch (error) {
      console.error('Failed to reorder sites:', error);
      // Could potentially revert the UI state here
    }

    // Reset drag state
    resetDragState();
  }
</script>

<section class="sites-section" id="sites-section">
  <header class="sites-header">
    <h2 class="text-sm font-medium" style="color: var(--pc-text-primary);">
      Sites
    </h2>
    <div class="header-actions">
      <button
        class="toggle-btn"
        onclick={handleDisableAll}
        disabled={isTogglingAll}
        title="Turn off all sites"
        aria-label="Turn off all sites"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="5" y="5" width="14" height="14" rx="2" stroke-width="2" />
        </svg>
      </button>
      <button
        class="toggle-btn"
        onclick={handleEnableAll}
        disabled={isTogglingAll}
        title="Turn on all sites"
        aria-label="Turn on all sites"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="5" y="5" width="14" height="14" rx="2" stroke-width="2" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4"
          />
        </svg>
      </button>
      <ThemeSelector
        currentTheme={$theme}
        {themeOptions}
        onThemeChange={handleThemeChange}
      />
    </div>
  </header>
  <div class="sites-scrollable">
    <div
      class="grid grid-cols-1 gap-2 mt-2"
      role="list"
      ondragleave={(e) => handleDragLeave(e)}
    >
      {#each sites as site, index (site.id)}
        <div
          class="drag-container"
          class:drag-over={dragOverIndex === index}
          class:dragging={draggedIndex === index}
          draggable="true"
          role="listitem"
          ondragstart={(e) => handleDragStart(e, index)}
          ondragend={handleDragEnd}
          ondragover={(e) => handleDragOver(e, index)}
          ondrop={(e) => handleDrop(e, index)}
        >
          <SiteCard {site} />
        </div>
      {/each}

      <!-- Drop zone for the end of the list -->
      <div
        class="drop-zone"
        class:drag-over={dragOverIndex === sites.length}
        role="application"
        ondragover={(e) => handleDragOver(e, sites.length)}
        ondrop={(e) => handleDrop(e, sites.length)}
      ></div>
    </div>
  </div>
</section>

<style>
  .sites-section {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .sites-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0.25rem;
    border-radius: 0.5rem;
    color: var(--pc-text-secondary);
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    opacity: 0.6;
  }

  .toggle-btn:hover:not(:disabled) {
    background: var(--pc-bg-hover);
    border-color: var(--pc-border);
    opacity: 0.8;
  }

  .toggle-btn:active:not(:disabled) {
    transform: scale(0.9);
  }

  .toggle-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .toggle-btn:disabled:hover {
    background: transparent;
    border-color: transparent;
    opacity: 0.3;
  }

  .toggle-btn:disabled:active {
    transform: none;
  }

  .sites-scrollable {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    /* Hide scrollbar for Firefox */
    scrollbar-width: none;
    /* Hide scrollbar for IE and Edge */
    -ms-overflow-style: none;
  }

  /* Ensure webkit scrollbar is completely hidden */
  .sites-scrollable::-webkit-scrollbar {
    display: none;
    width: 0;
    background: transparent;
  }

  .drag-container::before {
    content: '';
    position: absolute;
    top: -5px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--pc-success);
    opacity: 0;
    z-index: 10;
  }

  .drag-container.drag-over::before {
    opacity: 1;
  }

  .drag-container {
    position: relative;
  }

  .drag-container:active {
    cursor: grabbing;
  }

  .drag-container.dragging {
    opacity: 0.75;
  }

  .drop-zone {
    height: 8px;
    position: relative;
    margin-top: -4px;
  }

  .drop-zone::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--pc-success);
    opacity: 0;
    z-index: 10;
  }

  .drop-zone.drag-over::before {
    opacity: 1;
  }
</style>
