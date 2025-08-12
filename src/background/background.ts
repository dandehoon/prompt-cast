import { onMessage } from '@/shared';
import { TabManager } from './tabManager';
import { MessageHandler } from './messageHandler';
import { SiteManager } from './siteManager';
import { withErrorHandling } from './utils/errorHandling';

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
    onMessage(
      'SEND_MESSAGE',
      withErrorHandling(async (message) => {
        await this.messageHandler.sendMessageToSitesRobust(message.data);
      }, 'Send message'),
    );

    // Handle site toggle
    onMessage(
      'SITE_TOGGLE',
      withErrorHandling(async (message) => {
        await this.siteManager.toggleSite(message.data);
      }, 'Site toggle'),
    );

    // Handle tab focus
    onMessage(
      'FOCUS_TAB',
      withErrorHandling(async (message) => {
        await this.tabManager.focusTab(message.data.siteId);
      }, 'Focus tab'),
    );

    // Handle close all tabs
    onMessage(
      'CLOSE_ALL_TABS',
      withErrorHandling(async () => {
        await this.tabManager.closeAllTabs();
      }, 'Close all tabs'),
    );

    // Handle site config updates - optimize to update instead of recreate
    onMessage(
      'UPDATE_SITE_CONFIGS',
      withErrorHandling(async (message) => {
        this.siteManager.initializeSitesFromConfigs(message.data);
        // Update managers with new configurations instead of recreating
        this.tabManager.updateSites(this.siteManager.sites);
        this.messageHandler.updateSites(this.siteManager.sites);
      }, 'Update site configs'),
    );

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
    onMessage(
      'GET_SITE_STATUS',
      withErrorHandling(async (message) => {
        const site = this.siteManager.sites[message.data.siteId];
        if (!site) {
          return { status: 'disconnected' as const };
        }
        const status = await this.messageHandler.getSiteStatus(site);
        return { status };
      }, 'Get site status'),
    );
  }
}
