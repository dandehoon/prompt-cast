/**
 * Site configuration and related types
 */
import type { SiteStatusType } from '../shared/constants';

export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  colors: {
    light: string;
    dark: string;
  };
  hostPatterns: string[];
  inputSelectors: string[];
  submitSelectors: string[];
}

export interface SiteConfigsPayload {
  configs: Record<string, SiteConfig>;
}

// Enhanced site interface that includes dynamic properties for UI
export interface EnhancedSite extends SiteConfig {
  status: SiteStatusType;
  enabled: boolean;
  color: string;
}
