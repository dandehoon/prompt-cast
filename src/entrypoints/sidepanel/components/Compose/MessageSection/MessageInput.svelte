<script lang="ts">
  interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    disabled?: boolean;
    placeholder?: string;
    messageInputRef?: HTMLTextAreaElement;
    onCloseAll?: () => void;
    closeAllLoading?: boolean;
  }

  let {
    value,
    onChange,
    onSend,
    onArrowUp,
    onArrowDown,
    disabled = false,
    placeholder = 'Enter your prompt...',
    messageInputRef = $bindable(),
    onCloseAll,
    closeAllLoading = false,
  }: Props = $props();

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    onChange(target.value);

    // Auto-resize functionality
    target.style.height = 'auto';
    const scrollHeight = target.scrollHeight;
    const lineHeight = 20; // Approximate line height in pixels
    const maxLines = 15;
    const maxHeight = lineHeight * maxLines;

    if (scrollHeight <= maxHeight) {
      target.style.height = `${scrollHeight}px`;
    } else {
      target.style.height = `${maxHeight}px`;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Enter sends message, Shift+Enter creates new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }

    // Arrow up fills with previous prompt when cursor is at start
    if (event.key === 'ArrowUp' && onArrowUp) {
      const target = event.target as HTMLTextAreaElement;
      // Only trigger history if cursor is at the very beginning of the text
      if (target.selectionStart === 0 && target.selectionEnd === 0) {
        event.preventDefault();
        onArrowUp();
      }
    }

    // Arrow down fills with next prompt when cursor is at end and we're in history mode
    if (event.key === 'ArrowDown' && onArrowDown) {
      const target = event.target as HTMLTextAreaElement;
      // Only trigger if cursor is at the very end of the text
      if (
        target.selectionStart === value.length &&
        target.selectionEnd === value.length
      ) {
        event.preventDefault();
        onArrowDown();
      }
    }
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <label
      for="message-input"
      class="block text-sm font-medium"
      style:color="var(--pc-text-primary)"
    >
      Prompt
    </label>
    <button
      id="close-all-tabs-button"
      onclick={onCloseAll}
      disabled={closeAllLoading}
      class="p-2 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style:color="var(--pc-error)"
      title="Close All Tabs"
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
  <textarea
    id="message-input"
    bind:this={messageInputRef}
    {value}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    {placeholder}
    {disabled}
    class="w-full min-h-20 p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-y-auto"
    style:background-color="var(--pc-bg-card)"
    style:border="1px solid var(--pc-border)"
    style:color="var(--pc-text-primary)"
    style:line-height="20px"
  ></textarea>
</div>

<style>
  textarea:focus {
    outline: none;
  }

  textarea::placeholder {
    color: var(--pc-text-muted);
  }
</style>
