import React from 'react';
import { ServiceCard } from './ServiceCard';
import { AIService, AIServiceId } from '../../shared/types';

interface AIServicesSectionProps {
  services: Record<AIServiceId, AIService>;
  onServiceToggle: (serviceId: AIServiceId, enabled: boolean) => void;
  onCloseTab: (serviceId: AIServiceId) => void;
  onFocusTab: (serviceId: AIServiceId) => void;
  onCloseAllTabs: () => void;
  closeAllLoading: boolean;
}

export function AIServicesSection({
  services,
  onServiceToggle,
  onCloseTab,
  onFocusTab,
  onCloseAllTabs,
  closeAllLoading,
}: AIServicesSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Sites</h2>
        <button
          onClick={onCloseAllTabs}
          disabled={closeAllLoading}
          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Close All AI Tabs"
        >
          {closeAllLoading ? (
            <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(Object.values(services) as AIService[]).map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onToggle={onServiceToggle}
            onCloseTab={onCloseTab}
            onFocusTab={onFocusTab}
          />
        ))}
      </div>
    </div>
  );
}
