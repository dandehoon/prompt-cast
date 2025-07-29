import React from 'react';
import { AIService } from '../../shared/types';
import { SERVICE_STATUS } from '../../shared/constants';
import { getServiceById } from '../../shared/serviceConfig';

interface SettingsProps {
  services: Record<string, AIService>;
  onServiceToggle: (serviceId: string, enabled: boolean) => void;
}

export function Settings({ services, onServiceToggle }: SettingsProps) {
  const getServiceLogoColor = (serviceId: string) => {
    const serviceConfig = getServiceById(serviceId);
    return serviceConfig?.color || 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case SERVICE_STATUS.CONNECTED:
        return 'text-green-500';
      case SERVICE_STATUS.LOADING:
        return 'text-yellow-500';
      case SERVICE_STATUS.ERROR:
        return 'text-red-500';
      default:
        return 'text-gray-500';
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ai-text">AI Services Settings</h2>

      <div className="space-y-3">
        {(Object.values(services)).map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between p-3 bg-ai-card border border-ai-border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded-full ${getServiceLogoColor(service.id)}`}></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-ai-text">{service.name}</span>
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
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
