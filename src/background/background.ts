import { onMessage } from '@/shared';
import { logger } from '@/shared';
import { TabManager } from './tabManager';
import { MessageHandler } from './messageHandler';
import { SiteManager } from './siteManager';

export class BackgroundSite {
  private tabManager: TabManager;
  private messageHandler: MessageHandler;
  private siteManager: SiteManager;

  constructor() {
    this.siteManager = new SiteManager();
    this.tabManager = new TabManager(this.siteManager.sites);
    this.messageHandler = new MessageHandler(
      this.siteManager.sites,
      this.tabManager,
    );
    this.initializeListeners();
  }

  private initializeListeners(): void {
    // Handle message sending
    onMessage('SEND_MESSAGE', async (message) => {
      try {
        await this.messageHandler.sendMessageToSitesRobust(message.data);
      } catch (error) {
        logger.error('Send message error:', error);
        throw error;
      }
    });

    // Handle site toggle
    onMessage('SITE_TOGGLE', async (message) => {
      try {
        await this.siteManager.toggleSite(message.data);
      } catch (error) {
        logger.error('Site toggle error:', error);
        throw error;
      }
    });

    // Handle tab focus
    onMessage('FOCUS_TAB', async (message) => {
      try {
        await this.tabManager.focusTab(message.data.siteId);
      } catch (error) {
        logger.error('Focus tab error:', error);
        throw error;
      }
    });

    // Handle close all tabs
    onMessage('CLOSE_ALL_TABS', async () => {
      try {
        await this.tabManager.closeAllTabs();
      } catch (error) {
        logger.error('Close all tabs error:', error);
        throw error;
      }
    });

    // Handle site config updates
    onMessage('UPDATE_SITE_CONFIGS', async (message) => {
      try {
        this.siteManager.initializeSitesFromConfigs(message.data);
        // Update TabManager with new site configurations
        this.tabManager = new TabManager(this.siteManager.sites);
        this.messageHandler = new MessageHandler(
          this.siteManager.sites,
          this.tabManager,
        );
      } catch (error) {
        logger.error('Update site configs error:', error);
        throw error;
      }
    });

    // Handle get site configs
    onMessage('GET_SITE_CONFIGS', () => {
      return { data: { configs: this.siteManager.sites } };
    });

    // Handle get site by URL
    onMessage('GET_SITE_BY_URL', (message) => {
      const config = this.siteManager.getSiteByUrl(message.data.url);
      return { config };
    });

    // Handle get site status
    onMessage('GET_SITE_STATUS', async (message) => {
      const site = this.siteManager.sites[message.data.siteId];
      if (!site) {
        return { status: 'disconnected' as const };
      }
      const status = await this.messageHandler.getSiteStatus(site);
      return { status };
    });
  }
}
