<script lang="ts">
  import MessageInput from './MessageInput.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import { messageStore, messageActions } from '../../../stores/messageStore';
  import { toasts } from '../../../stores/toastStore';
  import { enabledCount, connectedCount } from '../../../stores/siteStore';
  import {
    tabOperationsStore,
    tabOperationsActions,
  } from '../../../stores/tabOperationsStore';
  import { onMount } from 'svelte';
  import {
    createAutoFocusHandler,
    safeFocus,
    autoSelectText,
  } from '@/shared/focusUtils';

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

  // Simplified state for button
  const buttonDisabled = $derived(!hasMessage || messageState.sendLoading);
  const buttonText = $derived(messageState.sendLoading ? 'Sending...' : 'Send');

  // Local ref for message input - handle it here since parent doesn't care
  let messageInputRef = $state<HTMLTextAreaElement>();

  // Auto-focus management - derived from loading state
  const autoFocusEnabled = $derived(!messageState.sendLoading);
  let autoFocusHandler: ReturnType<typeof createAutoFocusHandler> | undefined;

  // Update the input ref in the store when it changes
  $effect(() => {
    if (messageInputRef) {
      messageActions.setInputRef(messageInputRef);
    }
  });

  // Initialize and setup auto-focus on mount
  onMount(() => {
    messageActions.initialize();

    // Initial auto-focus and auto-select text when popup opens
    if (messageInputRef) {
      safeFocus(messageInputRef);
      autoSelectText(messageInputRef);
    }

    // Setup auto-focus handler for clicks
    autoFocusHandler = createAutoFocusHandler(
      () => messageInputRef,
      () => autoFocusEnabled,
    );
    autoFocusHandler.attach();

    // Cleanup function
    return () => {
      autoFocusHandler?.detach();
    };
  });
</script>

<footer
  class="p-4 pt-2 pb-2 space-y-2"
  style="border-top: 1px solid var(--pc-border);"
>
  <div class="flex items-center justify-between mb-1">
    <div class="flex-1">
      <MessageInput
        value={messageState.current}
        onChange={messageActions.setMessage}
        onSend={messageActions.sendMessage}
        onArrowUp={messageActions.handleArrowUp}
        onArrowDown={messageActions.handleArrowDown}
        disabled={messageState.sendLoading}
        onCloseAll={tabOperationsActions.closeAllTabs}
        closeAllLoading={tabOpsState.closeAllLoading}
        bind:messageInputRef
      />
    </div>
  </div>

  <button
    id="send-message-button"
    onclick={messageActions.sendMessage}
    disabled={buttonDisabled}
    class="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
    class:cursor-pointer={!buttonDisabled}
    style:background-color={buttonDisabled
      ? 'var(--pc-text-disabled)'
      : 'var(--pc-accent)'}
    style:color="var(--pc-text-inverted)"
  >
    {buttonText}
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
