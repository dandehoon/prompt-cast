/**
 * Sleep utility function to replace Promise setTimeout pattern
 */
export const sleep = (duration: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
