/**
 * Storage and user preferences types
 */
import type { ThemeOption } from '../shared/constants';

export interface UserPreferences {
  sites: Partial<Record<string, { enabled: boolean }>>;
  siteOrder?: string[];
  theme?: ThemeOption;
}
