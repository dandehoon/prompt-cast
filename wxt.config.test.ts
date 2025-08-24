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
    commands: {
      '_execute_action': {
        suggested_key: {
          default: 'Alt+P',
          mac: 'Alt+P',
        },
        description: 'Open Prompt Cast popup',
      },
      'close-all-tabs': {
        suggested_key: {
          default: 'Alt+Shift+P',
          mac: 'Alt+Shift+P',
        },
        description: 'Close all AI site tabs',
      },
    },
  },
});
