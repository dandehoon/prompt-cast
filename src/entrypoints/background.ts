import { defineBackground } from '#imports';
import { BackgroundSite } from '@/background';

export default defineBackground(() => {
  new BackgroundSite();
});
