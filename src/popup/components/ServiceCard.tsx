import React from 'react';
import { SERVICE_STATUS } from '../../shared/constants';
import { AIService } from '../../shared/types';
import { getServiceById } from '../../shared/serviceConfig';

interface ServiceCardProps {
  service: AIService;
  onFocusTab: (serviceId: string) => void;
}

export function ServiceCard({ service, onFocusTab }: ServiceCardProps) {
  const getServiceLogoColor = () => {
    const serviceConfig = getServiceById(service.id);
    return serviceConfig?.color || 'bg-gray-500';
  };

  const handleCardClick = () => {
    // Focus the service tab if enabled (regardless of connection status)
    if (service.enabled) {
      onFocusTab(service.id);
    }
  };

  const cursorStyle = service.enabled ? 'cursor-pointer' : 'cursor-default';

  return (
    <div
      className={`service-card bg-ai-card border border-ai-border rounded-lg p-3 transition-all ${cursorStyle}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full service-logo ${getServiceLogoColor()}`}></div>
          <span className="text-sm font-medium">{service.name}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${service.status === SERVICE_STATUS.CONNECTED ? 'bg-green-500' : service.status === SERVICE_STATUS.LOADING ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
      </div>
    </div>
  );
}
