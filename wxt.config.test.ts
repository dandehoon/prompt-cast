import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// Test configuration for WXT with localhost permissions
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.NODE_ENV': JSON.stringify('test'),
    },
    mode: 'test',
  }),
  manifest: {
    name: 'Prompt Cast (Test)',
    description:
      '📢 Broadcast your prompts to multiple AI sites at once (Test Mode)',
    version: '1.2.0',
    permissions: ['tabs', 'scripting', 'storage'],
    host_permissions: ['*://localhost/*'],
  },
});
