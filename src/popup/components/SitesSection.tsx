import React from 'react';
import { SiteCard } from './SiteCard';
import { AISite } from '../../shared/types';

interface SitesSectionProps {
  sites: Record<string, AISite>;
  onFocusTab: (siteId: string) => void;
  onCloseAllTabs: () => void;
  closeAllLoading: boolean;
}

export function SitesSection({
  sites,
  onFocusTab,
  onCloseAllTabs,
  closeAllLoading,
}: SitesSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ai-text-primary">Sites</h2>
        <button
          onClick={onCloseAllTabs}
          disabled={closeAllLoading}
          className="p-1 text-ai-error hover:text-ai-error hover:bg-ai-error-light rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Close All"
        >
          {closeAllLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-ai-error border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.values(sites) as AISite[])
          .filter(site => site.enabled)
          .map((site) => (
            <SiteCard
              key={site.id}
              site={site}
              onFocusTab={onFocusTab}
            />
          ))}
      </div>
    </div>
  );
}
