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

  // Hide indicator when inactive (no loading and no toasts and no sites)
  const shouldHide = $derived(!isLoading && !latestToast && enabledCount === 0);

  const getDefaultMessage = () => {
    if (isLoading) {
      return 'Loading...';
    }
    if (enabledCount === 0) {
      return 'No sites enabled';
    }
    if (connectedCount === 0) {
      return `${enabledCount} sites enabled`;
    }
    return `${connectedCount}/${enabledCount} sites ready`;
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return 'loading';
    }

    if (!latestToast) {
      return 'default';
    }

    switch (latestToast.type) {
      case TOAST_TYPES.SUCCESS:
        return 'success';
      case TOAST_TYPES.ERROR:
        return 'error';
      case TOAST_TYPES.INFO:
      default:
        return 'info';
    }
  };

  const statusIcon = $derived(getStatusIcon());
  const statusMessage = $derived(
    latestToast ? latestToast.message : getDefaultMessage(),
  );
</script>

{#if !shouldHide}
  <div class="flex items-center space-x-2">
    {#if latestToast || isLoading}
      <div class="relative">
        {#if statusIcon === 'loading'}
          <div
            class="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
          ></div>
        {:else if statusIcon === 'success'}
          <div
            class="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
          >
            <svg
              class="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        {:else if statusIcon === 'error'}
          <div
            class="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"
          >
            <svg
              class="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        {:else if statusIcon === 'info'}
          <div
            class="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center"
          >
            <svg
              class="w-2.5 h-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        {:else}
          <div class="w-4 h-4 rounded-full bg-gray-400"></div>
        {/if}
      </div>
    {/if}
    <span
      class="text-xs opacity-70 max-w-48 whitespace-pre-line break-words"
      style="color: var(--pc-text-secondary);"
    >
      {statusMessage}
    </span>
  </div>
{/if}
