import { useState, useEffect, useCallback } from 'react';
import { ServiceConfig } from '../../shared/types';
import { SERVICE_CONFIGS } from '../../shared/serviceConfig';
import { ChromeMessaging } from '../../shared/messaging';
import { logger } from '../../shared/logger';

// Initialize services from centralized SERVICE_CONFIGS
function createDefaultServices(): ServiceConfig {
  const services: ServiceConfig = {};

  Object.values(SERVICE_CONFIGS).forEach((config) => {
    services[config.id] = {
      id: config.id,
      name: config.name,
      url: config.url,
      enabled: config.enabled,
      status: 'disconnected',
    };
  });

  return services;
}

export function useServices() {
  const [services, setServices] = useState<ServiceConfig>(
    createDefaultServices(),
  );

  const refreshServiceStates = useCallback(async () => {
    try {
      const tabs = await ChromeMessaging.queryTabs({});

      setServices((prevServices) => {
        const newServices = { ...prevServices };

        // Reset all services to disconnected
        Object.values(newServices).forEach((service) => {
          service.status = 'disconnected';
          service.tabId = undefined;
        });

        // Check which services have open tabs
        tabs.forEach((tab) => {
          Object.values(newServices).forEach((service) => {
            if (tab.url && tab.url.startsWith(service.url)) {
              service.status = 'connected';
              service.tabId = tab.id;
            }
          });
        });

        return newServices;
      });
    } catch (error) {
      logger.error('Failed to refresh service states:', error);
    }
  }, []);

  const toggleService = useCallback((serviceId: string, enabled: boolean) => {
    setServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        enabled,
      },
    }));
  }, []);

  const getEnabledServices = useCallback(() => {
    return Object.keys(services).filter(
      (serviceId) => services[serviceId].enabled,
    );
  }, [services]);

  const getConnectedCount = useCallback(() => {
    return Object.values(services).filter((s) => s.status === 'connected')
      .length;
  }, [services]);

  const getEnabledCount = useCallback(() => {
    return Object.values(services).filter((s) => s.enabled).length;
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
