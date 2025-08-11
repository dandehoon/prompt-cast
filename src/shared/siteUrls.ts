import { getAllSiteConfigs } from '../background/siteConfigs';

/**
 * Get all site URLs from the centralized site configuration (sync for build-time)
 */
export function getSiteUrls(): string[] {
  const configs = getAllSiteConfigs();
  return Object.values(configs).map((config) => config.url);
}

/**
 * Get all site URLs from the centralized site configuration (runtime)
 */
export function getSiteUrlsRuntime(): string[] {
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
      // Convert https://example.com/ to *://example.com/*
      return `*://${urlObj.hostname}/*`;
    } catch {
      // Fallback for invalid URLs
      return url.replace(/^https?:/, '*:') + '*';
    }
  });
  return Array.from(new Set(matches));
}

/**
 * Convert site URLs to manifest host permissions
 */
export function getHostPermissions(): string[] {
  if (import.meta.env?.NODE_ENV === 'test') {
    return ['*://localhost/*'];
  }
  const urls = getSiteUrls();
  return urls.map((url) => {
    try {
      const urlObj = new URL(url);
      // Convert https://example.com/ to https://example.com/*
      return `${urlObj.protocol}//${urlObj.hostname}/*`;
    } catch {
      // Fallback for invalid URLs
      return url.endsWith('/') ? url + '*' : url + '/*';
    }
  });
}
