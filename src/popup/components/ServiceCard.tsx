import React from 'react';
import { SERVICE_STATUS } from '../../shared/constants';
import { AIService, AIServiceId } from '../../shared/types';

interface ServiceCardProps {
  service: AIService;
  onToggle: (serviceId: AIServiceId, enabled: boolean) => void;
  onFocusTab: (serviceId: AIServiceId) => void;
}

export function ServiceCard({ service, onToggle, onFocusTab }: ServiceCardProps) {
  const getServiceLogoColor = () => {
    switch (service.id) {
      case 'chatgpt':
        return 'bg-green-500';
      case 'claude':
        return 'bg-orange-500';
      case 'gemini':
        return 'bg-blue-500';
      case 'grok':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Don't handle click if clicking on toggle
    if (
      target.classList.contains('service-toggle') ||
      target.classList.contains('slider') ||
      target.closest('.toggle-switch')
    ) {
      return;
    }

    // If service is disabled, enable it
    if (!service.enabled) {
      onToggle(service.id, true);
    } else {
      // If service is enabled, focus its tab
      onFocusTab(service.id);
    }
  };

  // Lower brightness when disabled or not connected
  const isInactive = !service.enabled || service.status !== SERVICE_STATUS.CONNECTED;
  const cardOpacity = isInactive ? 'opacity-50' : 'opacity-100';

  return (
    <div
      className={`service-card bg-ai-card border border-ai-border rounded-lg p-3 cursor-pointer transition-all ${cardOpacity}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full service-logo ${getServiceLogoColor()}`}></div>
          <span className="text-sm font-medium">{service.name}</span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            className="service-toggle"
            checked={service.enabled}
            onChange={(e) => onToggle(service.id, e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}
