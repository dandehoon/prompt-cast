<script lang="ts">
  import { onMount } from 'svelte';
  import SitesSection from './SitesSection/SitesSection.svelte';
  import MessageSection from './MessageSection/MessageSection.svelte';
  import type { EnhancedSite } from '@/types';
  import {
    sitesWithStatus,
    enabledCount,
    connectedCount,
  } from '../../stores/siteStore';
  import { messageStore, messageActions } from '../../stores/messageStore';
  import { tabOperationsStore } from '../../stores/tabOperationsStore';
  import { toasts } from '../../stores/toastStore';
  import { resolvedTheme } from '../../stores/themeStore';

  // Reactive store values
  let sites = $derived.by(() => {
    const sitesWithStatusFn = $sitesWithStatus as (
      isDark?: boolean,
    ) => Record<string, EnhancedSite>;
    const isDark = $resolvedTheme === 'dark';
    return sitesWithStatusFn(isDark);
  });

  let messageState = $derived($messageStore);
  let tabOpsState = $derived($tabOperationsStore);
  let toastsList = $derived($toasts);
  let sitesConnectedCount = $derived($connectedCount);
  let sitesEnabledCount = $derived($enabledCount);
  let isLoading = $derived(
    messageState.sendLoading || tabOpsState.closeAllLoading,
  );

  // Local ref for message input - don't bind to store directly
  let messageInputRef = $state<HTMLTextAreaElement>();

  // Initialize message store on mount
  onMount(() => {
    messageActions.initialize();
    
    // Auto-focus the input when popup opens
    setTimeout(() => {
      if (messageInputRef) {
        messageInputRef.focus();
      }
    }, 100);
  });
</script>

<div class="flex flex-col h-full" style="background-color: var(--pc-bg-primary);">
  <main class="p-4 space-y-4">
    <SitesSection {sites} />
  </main>

  <MessageSection
    message={messageState.current}
    sendLoading={messageState.sendLoading}
    bind:messageInputRef
    toasts={toastsList}
    {isLoading}
    connectedCount={sitesConnectedCount}
    enabledCount={sitesEnabledCount}
  />
</div>
