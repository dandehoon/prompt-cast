/**
 * Site configuration and related types
 */
import type { SiteStatusType } from '@/shared';

export interface SiteConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  colors: {
    light: string;
    dark: string;
  };
  inputSelectors: string[];
  submitSelectors: string[];
  injectionMethod?: 'execCommand';
  chatUriPatterns?: string[];
}

// Enhanced site interface that includes dynamic properties for UI
export interface EnhancedSite extends SiteConfig {
  status: SiteStatusType;
  enabled: boolean;
  color: string;
}
