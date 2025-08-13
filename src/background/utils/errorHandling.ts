import { logger } from '@/shared';

/**
 * Wrapper function to handle common error logging and re-throwing pattern
 * Eliminates boilerplate from message handlers
 */
export function withErrorHandling<T extends unknown[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await operation(...args);
    } catch (error) {
      logger.error(`${operationName} error:`, error);
      throw error;
    }
  };
}
