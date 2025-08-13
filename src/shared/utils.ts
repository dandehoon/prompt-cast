/**
 * Sleep utility function to replace Promise setTimeout pattern
 */
export const sleep = (duration: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};

/**
 * Debounce function to limit rapid function calls
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  interval: number,
): ((...args: Parameters<T>) => void) => {
  let isThrottled = false;

  return (...args: Parameters<T>) => {
    if (!isThrottled) {
      func(...args);
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, interval);
    }
  };
};

/**
 * Format error objects into readable strings
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${
      error.stack ? '\n' + error.stack : ''
    }`;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error === null) {
    return 'Unknown error: null';
  }

  if (error === undefined) {
    return 'Unknown error: undefined';
  }

  // Return 'Unknown error' for objects that can't be serialized meaningfully
  return 'Unknown error';
};

/**
 * Validate if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize message by removing HTML tags and trimming
 */
export const sanitizeMessage = (message: string): string => {
  if (!message || typeof message !== 'string') {
    return '';
  }

  // Remove HTML tags and script content more thoroughly
  let sanitized = message.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    '',
  );
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length (example: 5000 chars)
  if (sanitized.length > 5000) {
    sanitized = sanitized.substring(0, 5000);
  }

  return sanitized;
};

/**
 * Generate unique ID with optional prefix
 */
export const generateId = (prefix = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2);
  return `${prefix}-${timestamp}-${randomStr}`;
};
