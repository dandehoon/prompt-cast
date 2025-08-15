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
    version: '2.1.0',
    permissions: ['tabs', 'scripting', 'storage'],
    host_permissions: getHostPermissions(),
  },
});
