<script lang="ts">
  import { onMount } from 'svelte';
  import AppHeader from './components/AppHeader.svelte';
  import Compose from './components/Compose/Compose.svelte';
  import Settings from './components/Settings/Settings.svelte';
  import { siteActions } from './stores/siteStore';
  import { resolvedTheme } from './stores/themeStore';
  import type { TabId } from '@/types';
  import './app.css';

  // Local state - only UI related
  let activeTab = $state<TabId>('home');

  // Reactive theme application
  $effect(() => {
    if ($resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  // Initialize stores on mount
  onMount(() => {
    siteActions.refreshSiteStates();
  });
</script>

<div class="app pc-bg-primary pc-text-primary">
  <div class="flex flex-col h-full">
    <AppHeader {activeTab} onTabChange={(tabId) => (activeTab = tabId)} />

    <div class="flex-1 overflow-y-auto">
      {#if activeTab === 'home'}
        <Compose />
      {:else}
        <div class="p-4" style="background-color: var(--pc-bg-primary);">
          <Settings />
        </div>
      {/if}
    </div>
  </div>
</div>
