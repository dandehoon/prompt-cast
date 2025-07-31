import React from 'react';
import { AIService } from '../../shared/types';
import { SERVICE_STATUS, ThemeOption } from '../../shared/constants';
import { getServiceById } from '../../shared/serviceConfig';
import { ThemeSelector } from './ThemeSelector';

interface ThemeOptionItem {
  value: ThemeOption;
  label: string;
}

interface SettingsProps {
  services: Record<string, AIService>;
  onServiceToggle: (serviceId: string, enabled: boolean) => void;
  currentTheme: ThemeOption;
  themeOptions: ThemeOptionItem[];
  onThemeChange: (theme: ThemeOption) => void;
}

export function Settings({ services, onServiceToggle, currentTheme, themeOptions, onThemeChange }: SettingsProps) {
  const getServiceLogoColor = (serviceId: string) => {
    const serviceConfig = getServiceById(serviceId);
    return serviceConfig?.color || 'bg-ai-service-default';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case SERVICE_STATUS.CONNECTED:
        return 'text-ai-success';
      case SERVICE_STATUS.LOADING:
        return 'text-ai-warning';
      case SERVICE_STATUS.ERROR:
        return 'text-ai-error';
      default:
        return 'text-ai-text-disabled';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case SERVICE_STATUS.CONNECTED:
        return 'Connected';
      case SERVICE_STATUS.LOADING:
        return 'Loading...';
      case SERVICE_STATUS.ERROR:
        return 'Error';
      case SERVICE_STATUS.DISCONNECTED:
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">

      {/* Service Settings */}
      <div className="space-y-3">
        <h3 className="text-base font-medium text-ai-text-primary">Sites</h3>

        <div className="space-y-3">
          {(Object.values(services)).map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-3 bg-ai-bg-card border border-ai-border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full ${getServiceLogoColor(service.id)}`}></div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-ai-text-primary">{service.name}</span>
                  <span className={`text-xs ${getStatusColor(service.status)}`}>
                    {getStatusText(service.status)}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={service.enabled}
                  onChange={(e) => onServiceToggle(service.id, e.target.checked)}
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
    </div>
  );
}
