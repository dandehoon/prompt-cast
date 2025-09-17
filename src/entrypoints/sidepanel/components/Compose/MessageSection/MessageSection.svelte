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

  // Button disabled when no message AND not sending
  const buttonDisabled = $derived(!hasMessage);

  // Button click handler - send based on state
  const handleButtonClick = () => {
    messageActions.sendMessage();
  };

  // Local ref for message input - handle it here since parent doesn't care
  let messageInputRef = $state<HTMLTextAreaElement>();

  // Auto-focus management - disabled during sending to prevent conflicts
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
      () => true,
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
        disabled={false}
        onCloseAll={tabOperationsActions.closeAllTabs}
        closeAllLoading={tabOpsState.closeAllLoading}
        bind:messageInputRef
      />
    </div>
  </div>

  <button
    id="send-message-button"
    onclick={handleButtonClick}
    disabled={buttonDisabled}
    class="w-full px-4 py-2 rounded-lg text-sm font-medium disabled:cursor-not-allowed"
    class:cursor-pointer={!buttonDisabled}
    class:btn-disabled={buttonDisabled}
    class:btn-normal={!messageState.sendLoading && !buttonDisabled}
  >
    Send
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
  /* Button states mapped to CSS variables (no inline styles) */
  .btn-disabled {
    background-color: var(--pc-text-disabled);
    color: var(--pc-text-inverted);
  }

  .btn-normal {
    background-color: var(--pc-accent);
    color: var(--pc-text-inverted);
  }

  /* Preserve hover behavior only for non-disabled buttons */
  button.btn-normal:hover {
    background-color: var(--pc-accent-hover);
  }
</style>
