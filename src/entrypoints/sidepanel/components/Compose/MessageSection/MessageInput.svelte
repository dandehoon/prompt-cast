<script lang="ts">
  import Actions from './Actions.svelte';

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

  // Auto-resize function for reuse
  function autoResize(target: HTMLTextAreaElement) {
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

  // Track the last processed value to avoid duplicate resize calls
  let lastProcessedValue = value;

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const newValue = target.value;
    onChange(newValue);
    lastProcessedValue = newValue; // Update tracking before resize
    autoResize(target);
  }

  // Reactive effect to resize when value changes programmatically (not from user input)
  $effect(() => {
    if (messageInputRef && value !== lastProcessedValue) {
      autoResize(messageInputRef);
      lastProcessedValue = value;
    }
  });

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
  <div class="flex items-center justify-between mb-1">
    <label
      for="message-input"
      class="block text-sm font-medium"
      style:color="var(--pc-text-primary)"
    >
      Compose
    </label>
    <Actions {onCloseAll} {closeAllLoading} />
  </div>
  <textarea
    id="message-input"
    bind:this={messageInputRef}
    {value}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    {placeholder}
    {disabled}
    class="w-full min-h-20 p-3 rounded-lg disabled:opacity-50 resize-none overflow-y-auto"
    style:background-color="var(--pc-bg-card)"
    style:border="1px solid var(--pc-border)"
    style:color="var(--pc-text-primary)"
  ></textarea>
</div>

<style>
  #message-input {
    font-size: 1.1em;
  }

  #message-input:focus {
    outline: none;
  }

  #message-input::placeholder {
    color: var(--pc-text-muted);
  }
</style>
