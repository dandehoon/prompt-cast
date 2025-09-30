<script lang="ts">
  import { TOAST_TYPES } from '@/shared/constants';
  import type { ToastMessage } from '@/types';

  interface Props {
    toasts: ToastMessage[];
    isLoading: boolean;
    connectedCount: number;
    enabledCount: number;
  }

  let { toasts, isLoading, connectedCount, enabledCount }: Props = $props();

  const latestToast = $derived(toasts[toasts.length - 1]);

  const getDefaultMessage = () => {
    if (isLoading) return 'Waiting...';
    if (enabledCount === 0) return 'No sites enabled';
    if (connectedCount === 0) return `${enabledCount} sites enabled`;
    return `${connectedCount}/${enabledCount} sites ready`;
  };

  const statusIcon = $derived(() => {
    if (isLoading) return 'loading';
    if (!latestToast) return 'default';

    switch (latestToast.type) {
      case TOAST_TYPES.SUCCESS:
        return 'success';
      case TOAST_TYPES.ERROR:
        return 'error';
      case TOAST_TYPES.INFO:
      default:
        return 'info';
    }
  });

  const statusMessage = $derived(
    latestToast ? latestToast.message : getDefaultMessage(),
  );
</script>

<div class="flex items-center space-x-2">
  {#if latestToast || isLoading}
    {@const icon = statusIcon()}
    <div class="relative">
      {#if icon === 'loading'}
        <div
          class="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
          style:border-color="var(--pc-accent)"
        ></div>
      {:else if icon === 'default'}
        <div
          class="w-4 h-4 rounded-full"
          style:background-color="var(--pc-text-disabled)"
        ></div>
      {:else}
        <!-- Success, Error, Info icons with dynamic colors -->
        <div
          class="w-4 h-4 rounded-full flex items-center justify-center"
          style:background-color={icon === 'success'
            ? 'var(--pc-success)'
            : icon === 'error'
              ? 'var(--pc-error)'
              : 'var(--pc-accent)'}
        >
          {#if icon === 'success'}
            <svg
              class="w-2.5 h-2.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              style:color="var(--pc-text-inverted)"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          {:else if icon === 'error'}
            <svg
              class="w-2.5 h-2.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              style:color="var(--pc-text-inverted)"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          {:else if icon === 'info'}
            <svg
              class="w-2.5 h-2.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              style:color="var(--pc-text-inverted)"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  <span
    class="text-xs opacity-70 whitespace-pre-line break-words"
    style:color="var(--pc-text-secondary)"
  >
    {statusMessage}
  </span>
</div>
