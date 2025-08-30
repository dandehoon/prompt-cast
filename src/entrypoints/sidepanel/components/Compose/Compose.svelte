<script lang="ts">
  import SitesSection from './SitesSection/SitesSection.svelte';
  import MessageSection from './MessageSection/MessageSection.svelte';
</script>

<div
  class="flex flex-col h-full"
  style="background-color: var(--pc-bg-primary);"
>
  <main class="p-4 pt-2 space-y-4 flex-1 overflow-y-auto">
    <SitesSection />
  </main>

  <MessageSection />
</div>
