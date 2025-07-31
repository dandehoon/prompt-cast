import React from 'react';
import { SITE_STATUS } from '../../shared/constants';
import { AISite } from '../../shared/types';
import { getSiteById } from '../../shared/siteConfig';

interface SiteCardProps {
  site: AISite;
  onFocusTab: (siteId: string) => void;
}

export function SiteCard({ site, onFocusTab }: SiteCardProps) {
  const getSiteLogoColor = () => {
    const siteConfig = getSiteById(site.id);
    return siteConfig?.color || 'bg-ai-site-default';
  };

  const handleCardClick = () => {
    // Focus the site tab if enabled (regardless of connection status)
    if (site.enabled) {
      onFocusTab(site.id);
    }
  };

  const cursorStyle = site.enabled ? 'cursor-pointer' : 'cursor-default';

  return (
    <div
      className={`site-card bg-ai-bg-card border border-ai-border rounded-lg p-3 h-12 transition-all ${cursorStyle}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full site-logo ${getSiteLogoColor()}`}></div>
          <span className="text-sm font-medium text-ai-text-primary">{site.name}</span>
        </div>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${site.status === SITE_STATUS.CONNECTED ? 'bg-ai-success' : site.status === SITE_STATUS.LOADING ? 'bg-ai-warning' : 'bg-ai-text-disabled'}`}></div>
      </div>
    </div>
  );
}
