import { mount } from 'svelte';
import App from './App.svelte';
import './app.css';
import { logger } from '@/shared';

// Initialize Svelte app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    mount(App, {
      target: container,
    });
  } else {
    logger.error('App root element not found');
  }
});
