import { getAllSiteConfigs } from '../background/siteConfigs';

/**
 * Get all site URLs from the centralized site configuration
 */
export function getSiteUrls(): string[] {
  const configs = getAllSiteConfigs();
  return Object.values(configs).map(config => config.url);
}

/**
 * Convert site URLs to content script match patterns
 */
export function getContentScriptMatches(): string[] {
  const urls = getSiteUrls();
  return urls.map(url => {
    try {
      const urlObj = new URL(url);
      // Convert https://example.com/ to *://example.com/*
      return `*://${urlObj.hostname}/*`;
    } catch {
      // Fallback for invalid URLs
      return url.replace(/^https?:/, '*:') + '*';
    }
  });
}

/**
 * Convert site URLs to manifest host permissions
 */
export function getHostPermissions(): string[] {
  const urls = getSiteUrls();
  return urls.map(url => {
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
