import React from 'react';
import { ThemeOption } from '../../shared/constants';
import { EnhancedSite } from '../../shared/stores/siteStore';
import { ThemeSelector } from './ThemeSelector';

interface ThemeOptionItem {
  value: ThemeOption;
  label: string;
}

interface SettingsProps {
  sites: Record<string, EnhancedSite>;
  onSiteToggle: (siteId: string, enabled: boolean) => void;
  currentTheme: ThemeOption;
  themeOptions: ThemeOptionItem[];
  onThemeChange: (theme: ThemeOption) => void;
}

export function Settings({ sites, onSiteToggle, currentTheme, themeOptions, onThemeChange }: SettingsProps) {
  return (
    <>
      {/* Site Settings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-ai-text-primary">Sites</h3>
          <div className="w-6 h-6"></div>
        </div>

        <div className="space-y-2">
          {(Object.values(sites)).map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between p-3 h-12 bg-ai-bg-card border border-ai-border rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: site.color }}
                ></div>
                <span className="text-sm font-medium text-ai-text-primary">{site.name}</span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={site.enabled}
                  onChange={(e) => onSiteToggle(site.id, e.target.checked)}
                />
                <div className="w-11 h-6 bg-ai-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-ai-text-inverted after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ai-text-primary after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ai-success"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Settings */}
      <ThemeSelector
        currentTheme={currentTheme}
        themeOptions={themeOptions}
        onThemeChange={onThemeChange}
      />
    </>
  );
}
