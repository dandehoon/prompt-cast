import { useState, useEffect, useCallback } from 'react';
import { AIServiceId, ServiceConfig } from '../../shared/types';
import { ChromeMessaging } from '../../shared/messaging';

const defaultServices: ServiceConfig = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    enabled: true,
    status: 'disconnected',
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/',
    enabled: true,
    status: 'disconnected',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/',
    enabled: true,
    status: 'disconnected',
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com/',
    enabled: true,
    status: 'disconnected',
  },
};

export function useServices() {
  const [services, setServices] = useState<ServiceConfig>(defaultServices);

  const refreshServiceStates = useCallback(async () => {
    try {
      const tabs = await ChromeMessaging.queryTabs({});

      setServices(prevServices => {
        const newServices = { ...prevServices };

        // Reset all services to disconnected
        Object.values(newServices).forEach(service => {
          service.status = 'disconnected';
          service.tabId = undefined;
        });

        // Check which services have open tabs
        tabs.forEach(tab => {
          Object.values(newServices).forEach(service => {
            if (tab.url && tab.url.startsWith(service.url)) {
              service.status = 'connected';
              service.tabId = tab.id;
            }
          });
        });

        return newServices;
      });
    } catch (error) {
      console.error('Failed to refresh service states:', error);
    }
  }, []);

  const toggleService = useCallback(
    (serviceId: AIServiceId, enabled: boolean) => {
      setServices(prev => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          enabled,
        },
      }));
    },
    []
  );

  const getEnabledServices = useCallback(() => {
    return Object.keys(services).filter(
      serviceId => services[serviceId as AIServiceId].enabled
    );
  }, [services]);

  const getConnectedCount = useCallback(() => {
    return Object.values(services).filter(s => s.status === 'connected').length;
  }, [services]);

  const getEnabledCount = useCallback(() => {
    return Object.values(services).filter(s => s.enabled).length;
  }, [services]);

  useEffect(() => {
    refreshServiceStates();
  }, [refreshServiceStates]);

  return {
    services,
    toggleService,
    refreshServiceStates,
    getEnabledServices,
    getConnectedCount,
    getEnabledCount,
  };
}
