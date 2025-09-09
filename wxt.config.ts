import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import { getHostPermissions } from './src/shared/siteUrls';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Prompt Cast',
    description: '📢 Broadcast your prompts to multiple AI sites at once',
    version: '3.2.2',
    permissions: ['tabs', 'scripting', 'storage', 'sidePanel'],
    host_permissions: getHostPermissions(),
    action: {
      default_title: 'Open Prompt Cast',
    },
    side_panel: {
      default_path: 'sidepanel.html',
    },
    commands: {
      '_execute_action': {
        suggested_key: {
          default: 'Alt+P',
          mac: 'Alt+P',
        },
        description: 'Open side panel',
      },
      'close-all-tabs': {
        suggested_key: {
          default: 'Alt+Shift+P',
          mac: 'Alt+Shift+P',
        },
        description: 'Close AI tabs',
      },
    },
  },
});
