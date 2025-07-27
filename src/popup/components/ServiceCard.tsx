import React from 'react';
import { AIService, AIServiceId } from '../../shared/types';

interface ServiceCardProps {
  service: AIService;
  onToggle: (serviceId: AIServiceId, enabled: boolean) => void;
  onCloseTab: (serviceId: AIServiceId) => void;
  onFocusTab: (serviceId: AIServiceId) => void;
}

export function ServiceCard({ service, onToggle, onCloseTab, onFocusTab }: ServiceCardProps) {
  const getStatusClasses = () => {
    const baseClasses = 'w-2 h-2 rounded-full';
    switch (service.status) {
      case 'connected':
        return `${baseClasses} bg-green-500`;
      case 'loading':
        return `${baseClasses} bg-yellow-500 animate-pulse`;
      case 'error':
        return `${baseClasses} bg-red-500`;
      case 'disconnected':
      default:
        return `${baseClasses} bg-gray-500`;
    }
  };

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

    // Don't focus tab if clicking on toggle or close button
    if (
      target.classList.contains('service-toggle') ||
      target.classList.contains('close-tab-btn') ||
      target.classList.contains('slider') ||
      target.closest('.toggle-switch') ||
      target.closest('.close-tab-btn')
    ) {
      return;
    }

    onFocusTab(service.id);
  };

  return (
    <div
      className={`service-card bg-ai-card border border-ai-border rounded-lg p-3 cursor-pointer transition-all ${service.enabled ? 'opacity-100' : 'opacity-50'
        }`}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full service-logo ${getServiceLogoColor()}`}></div>
          <span className="text-sm font-medium">{service.name}</span>
        </div>
        <button
          className="close-tab-btn text-ai-text-secondary hover:text-red-400 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onCloseTab(service.id);
          }}
        >
          ×
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className={`status-indicator ${getStatusClasses()}`}></div>
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
