<script lang="ts">
  interface Props {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onArrowUp?: () => void;
    disabled?: boolean;
    placeholder?: string;
    messageInputRef?: HTMLTextAreaElement;
  }

  let {
    value,
    onChange,
    onSend,
    onArrowUp,
    disabled = false,
    placeholder = 'Ask anything',
    messageInputRef = $bindable(),
  }: Props = $props();

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    onChange(target.value);
    // Remove auto-resize functionality to keep height constant
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Enter sends message, Shift+Enter creates new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }

    // Arrow up fills with previous prompt when input is empty
    if (event.key === 'ArrowUp' && !value.trim() && onArrowUp) {
      event.preventDefault();
      onArrowUp();
    }
  }
</script>

<div class="space-y-2">
  <label
    for="messageInput"
    class="block text-sm font-medium"
    style="color: var(--pc-text-primary);"
  >
    Prompt
  </label>
  <textarea
    id="messageInput"
    bind:this={messageInputRef}
    {value}
    oninput={handleInput}
    onkeydown={handleKeyDown}
    {placeholder}
    {disabled}
    class="w-full h-20 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
    style="background-color: var(--pc-bg-card); border: 1px solid var(--pc-border); color: var(--pc-text-primary); --tw-ring-color: var(--pc-accent);"
    style:border-color={disabled ? 'var(--pc-border)' : 'var(--pc-border)'}
  ></textarea>
</div>

<style>
  textarea:focus {
    border-color: var(--pc-accent);
    box-shadow: 0 0 0 2px var(--pc-focus);
  }

  textarea::placeholder {
    color: var(--pc-text-muted);
  }
</style>
