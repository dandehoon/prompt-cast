import React from 'react';
import { TabId } from '../../shared/types';

interface AppHeaderProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Compose' },
  { id: 'settings', label: 'Settings' },
];

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  return (
    <header className="border-b border-ai-border">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center py-2 px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-0 ${activeTab === tab.id
              ? 'bg-ai-card text-ai-text border-b-2 border-blue-500'
              : 'text-ai-text-secondary hover:text-ai-text hover:bg-ai-card'
              }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
