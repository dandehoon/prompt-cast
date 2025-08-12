import { getAllSiteConfigs } from '../background/siteConfigs';

/**
 * Get all site URLs from the centralized site configuration (sync for build-time)
 */
export function getSiteUrls(): string[] {
  const configs = getAllSiteConfigs();
  return Object.values(configs).map((config) => config.url);
}

/**
 * Convert site URLs to content script match patterns
 */
export function getContentScriptMatches(): string[] {
  const urls = getSiteUrls();
  const matches = urls.map((url) => {
    try {
      const urlObj = new URL(url);
      return `*://${urlObj.hostname}/*`;
    } catch {
      return url.replace(/^https?:/, '*:') + '*';
    }
  });
  return Array.from(new Set(matches));
}

/**
 * Convert site URLs to manifest host permissions
 */
export function getHostPermissions(): string[] {
  const urls = getSiteUrls();
  const permissions = urls.map((url) => {
    try {
      const urlObj = new URL(url);
      // Convert https://example.com/ to https://example.com/*
      return `${urlObj.protocol}//${urlObj.hostname}/*`;
    } catch {
      // Fallback for invalid URLs
      return url.endsWith('/') ? url + '*' : url + '/*';
    }
  });
  return Array.from(new Set(permissions));
}
