/**
 * Core shared types used across the extension
 */
import type { SiteConfig } from './site';

export interface Response<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
  config?: SiteConfig | null;
}
