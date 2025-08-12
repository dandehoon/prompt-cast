<script lang="ts">
  import type { TabId } from '@/types';

  interface Props {
    activeTab: TabId;
    onTabChange: (tabId: TabId) => void;
  }

  let { activeTab, onTabChange }: Props = $props();

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Compose', icon: '✏️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];
</script>

<header class="border-b" style="border-color: var(--pc-border);">
  <div class="flex">
    {#each tabs as tab (tab.id)}
      <button
        id="tab-{tab.id}"
        class="flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-0 cursor-pointer"
        class:active={activeTab === tab.id}
        onclick={() => onTabChange(tab.id)}
      >
        <span>{tab.label}</span>
      </button>
    {/each}
  </div>
</header>

<style>
  button {
    background-color: transparent;
    color: var(--pc-text-secondary);
  }

  button:hover {
    color: var(--pc-text-primary);
    background-color: var(--pc-bg-card);
    cursor: pointer;
  }

  button.active {
    background-color: var(--pc-bg-card);
    color: var(--pc-text-primary);
    border-bottom: 2px solid var(--pc-accent);
  }
</style>
