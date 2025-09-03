<script lang="ts">
  import Compose from './components/Compose/Compose.svelte';
  import { resolvedTheme } from './stores/themeStore';
  import './app.css';

  // Reactive theme application
  $effect(() => {
    if ($resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
</script>

<div class="app pc-bg-primary pc-text-primary">
  <div class="flex flex-col h-full">
    <Compose />
  </div>
</div>
