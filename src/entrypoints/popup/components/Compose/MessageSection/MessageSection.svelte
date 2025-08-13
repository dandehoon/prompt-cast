<script lang="ts">
  import MessageInput from './MessageInput.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import { messageStore, messageActions } from '../../../stores/messageStore';
  import { toasts } from '../../../stores/toastStore';
  import { enabledCount, connectedCount } from '../../../stores/siteStore';
  import { tabOperationsStore } from '../../../stores/tabOperationsStore';
  import { onMount } from 'svelte';

  // All data comes from stores - no props needed!
  const messageState = $derived($messageStore);
  const toastsList = $derived($toasts);
  const sitesConnectedCount = $derived($connectedCount);
  const sitesEnabledCount = $derived($enabledCount);
  const tabOpsState = $derived($tabOperationsStore);

  const isLoading = $derived(
    messageState.sendLoading || tabOpsState.closeAllLoading,
  );
  const hasMessage = $derived(messageState.current.trim().length > 0);

  // Local ref for message input - handle it here since parent doesn't care
  let messageInputRef = $state<HTMLTextAreaElement>();

  // Update the input ref in the store when it changes
  $effect(() => {
    if (messageInputRef) {
      messageActions.setInputRef(messageInputRef);
    }
  });

  // Initialize and auto-focus on mount
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

<footer class="p-4 space-y-3" style="border-top: 1px solid var(--pc-border);">
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <MessageInput
        value={messageState.current}
        onChange={messageActions.setMessage}
        onSend={messageActions.sendMessage}
        onArrowUp={messageActions.handleArrowUp}
        disabled={messageState.sendLoading}
        bind:messageInputRef
      />
    </div>
  </div>

  <button
    id="send-message-button"
    onclick={messageActions.sendMessage}
    disabled={!hasMessage || messageState.sendLoading}
    class="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
    style="background-color: {!hasMessage || messageState.sendLoading
      ? 'var(--pc-text-disabled)'
      : 'var(--pc-accent)'}; color: var(--pc-text-inverted);"
  >
    {messageState.sendLoading ? 'Sending...' : 'Send'}
  </button>

  <div class="flex items-center justify-center">
    <StatusIndicator
      toasts={toastsList}
      {isLoading}
      connectedCount={sitesConnectedCount}
      enabledCount={sitesEnabledCount}
    />
  </div>
</footer>

<style>
  button:not(:disabled):hover {
    background-color: var(--pc-accent-hover);
  }
</style>
