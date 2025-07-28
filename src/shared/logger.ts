/**
 * Logger utility for consistent logging across the extension
 * Can be easily mocked in tests to avoid confusing console output
 */
export interface ILogger {
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

class Logger implements ILogger {
  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    console.log(message, ...args);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for testing
export { Logger };
