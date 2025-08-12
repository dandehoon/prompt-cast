<script lang="ts">
  import MessageInput from './MessageInput.svelte';
  import StatusIndicator from './StatusIndicator.svelte';
  import type { ToastMessage } from '@/types';
  import { messageActions } from '../../../stores/messageStore';
  import { onMount } from 'svelte';

  interface Props {
    message: string;
    sendLoading: boolean;
    messageInputRef?: HTMLTextAreaElement;
    toasts: ToastMessage[];
    isLoading: boolean;
    connectedCount: number;
    enabledCount: number;
  }

  let {
    message,
    sendLoading,
    messageInputRef = $bindable(),
    toasts,
    isLoading,
    connectedCount,
    enabledCount,
  }: Props = $props();

  const hasMessage = $derived(message.trim().length > 0);

  // Update the input ref in the store when it changes
  $effect(() => {
    if (messageInputRef) {
      messageActions.setInputRef(messageInputRef);
    }
  });
</script>

<footer class="p-4 space-y-3" style="border-top: 1px solid var(--pc-border);">
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <MessageInput
        value={message}
        onChange={messageActions.setMessage}
        onSend={messageActions.sendMessage}
        onArrowUp={messageActions.handleArrowUp}
        disabled={sendLoading}
        bind:messageInputRef
      />
    </div>
  </div>

  <button
    id="send-message-button"
    onclick={messageActions.sendMessage}
    disabled={!hasMessage || sendLoading}
    class="w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
    style="background-color: {!hasMessage || sendLoading
      ? 'var(--pc-text-disabled)'
      : 'var(--pc-accent)'}; color: var(--pc-text-inverted);"
  >
    {sendLoading ? 'Sending...' : 'Send'}
  </button>

  <div class="flex items-center justify-center">
    <StatusIndicator {toasts} {isLoading} {connectedCount} {enabledCount} />
  </div>
</footer>

<style>
  button:not(:disabled):hover {
    background-color: var(--pc-accent-hover);
  }
</style>
