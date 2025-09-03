import { onMessage, sendMessage } from '@/shared';
import { TabManager } from './tabManager';
import { MessageHandler } from './messageHandler';
import { SiteManager } from './siteManager';
import { withErrorHandling } from './utils/errorHandling';
import { browser } from '#imports';
import type { TabInfo, TabEventPayload, SiteTabsState } from '@/types';

export class BackgroundSite {
  private tabManager: TabManager;
  private messageHandler: MessageHandler;
  private siteManager: SiteManager;
  private currentActiveSiteId: string | null = null;

  constructor() {
    this.siteManager = new SiteManager();
    this.tabManager = new TabManager(this.siteManager);
    this.messageHandler = new MessageHandler(this.siteManager, this.tabManager);
    this.initializeListeners();
    this.initializeCommands();
    this.initializeSidePanel();
    this.initializeTabEventListeners();
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

    // Handle get site configs
    onMessage(
      'GET_SITE_CONFIGS',
      withErrorHandling(async () => {
        const configs = await this.siteManager.getAllSites();
        return { data: { configs } };
      }, 'Get site configs'),
    );

    // Handle get site order
    onMessage(
      'GET_SITE_ORDER',
      withErrorHandling(async () => {
        const order = await this.siteManager.getSiteOrder();
        return { order };
      }, 'Get site order'),
    );

    // Handle save site order
    onMessage(
      'SAVE_SITE_ORDER',
      withErrorHandling(async (message) => {
        await this.siteManager.setSiteOrder(message.data.order);
      }, 'Save site order'),
    );

    // Handle get site tabs
    onMessage(
      'GET_SITE_TABS',
      withErrorHandling(async () => {
        return await this.getSiteTabsState();
      }, 'Get site tabs'),
    );
  }

  private initializeCommands(): void {
    // Handle keyboard shortcuts
    browser.commands.onCommand.addListener(
      withErrorHandling(async (command) => {
        switch (command) {
          case 'open-side-panel':
            await this.openSidePanel();
            break;
          case 'close-all-tabs':
            await this.tabManager.closeAllTabs();
            break;
          default:
            console.warn(`Unknown command: ${command}`);
        }
      }, 'Handle command'),
    );
  }

  private initializeSidePanel(): void {
    // Set side panel to open when action icon is clicked
    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error('Failed to set panel behavior:', error));
  }

  private async openSidePanel(): Promise<void> {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.windowId) {
        await browser.sidePanel.open({ windowId: tab.windowId });
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }

  private initializeTabEventListeners(): void {
    browser.tabs.onCreated.addListener(
      withErrorHandling(async (tab) => {
        const affectedSiteId =
          tab.id && tab.url
            ? await this.getSiteIdForAffectedTab(tab.id, 'created')
            : undefined;
        await this.notifyTabEvent('created', affectedSiteId || undefined);
      }, 'Handle tab creation'),
    );

    browser.tabs.onActivated.addListener(
      withErrorHandling(async () => {
        await this.notifyTabEvent('activated');
      }, 'Handle tab activation'),
    );

    browser.tabs.onUpdated.addListener(
      withErrorHandling(async (tabId, changeInfo, _tab) => {
        if (changeInfo.url || changeInfo.status === 'complete') {
          const affectedSiteId = await this.getSiteIdForAffectedTab(
            tabId,
            'updated',
          );
          await this.notifyTabEvent('updated', affectedSiteId || undefined);
        }
      }, 'Handle tab update'),
    );

    browser.tabs.onRemoved.addListener(
      withErrorHandling(async (_tabId) => {
        await this.notifyTabEvent('removed');
      }, 'Handle tab removal'),
    );

    browser.windows.onFocusChanged.addListener(
      withErrorHandling(async (windowId) => {
        if (windowId !== browser.windows.WINDOW_ID_NONE) {
          await this.notifyTabEvent('activated');
        }
      }, 'Handle window focus change'),
    );
  }

  /**
   * Notify sidepanel about tab changes with actual tab info for instant updates
   */
  private async notifyTabEvent(
    eventType: 'created' | 'updated' | 'removed' | 'activated',
    affectedSiteId?: string,
  ): Promise<void> {
    try {
      const currentActiveSiteId = await this.tabManager.getActiveTabSiteId();
      this.currentActiveSiteId = currentActiveSiteId;

      // Include actual tab info for instant updates when available
      let tabInfo: TabInfo | undefined;
      if (affectedSiteId && eventType !== 'removed') {
        try {
          const allTabsInfo = await this.tabManager.getAllSiteTabsInfo();
          tabInfo = allTabsInfo[affectedSiteId] || undefined;
        } catch {
          // Continue without tab info if unavailable
        }
      }

      const payload: TabEventPayload = {
        eventType,
        affectedSiteId,
        currentActiveSiteId,
        timestamp: Date.now(),
        tabInfo,
      };

      try {
        await sendMessage('TAB_EVENT', payload);
      } catch (broadcastError) {
        if (process.env.NODE_ENV === 'development') {
          console.debug(
            'Tab event broadcast ignored (no receivers):',
            broadcastError,
          );
        }
      }
    } catch (error) {
      console.warn('Failed to notify tab event:', error);
    }
  }

  private async getSiteIdForAffectedTab(
    tabId: number,
    eventType: string,
  ): Promise<string | null> {
    try {
      if (eventType === 'removed') {
        return null;
      }

      const tab = await browser.tabs.get(tabId);
      if (!tab.url) return null;

      const allSites = await this.siteManager.getSiteValues();
      for (const site of allSites) {
        if (this.tabManager.isTabInChatContext(tab.url, site)) {
          return site.id;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getSiteTabsState(): Promise<SiteTabsState> {
    const allTabsInfo = await this.tabManager.getAllSiteTabsInfo();
    return {
      activeSiteId: this.currentActiveSiteId,
      siteTabs: allTabsInfo,
    };
  }
}
