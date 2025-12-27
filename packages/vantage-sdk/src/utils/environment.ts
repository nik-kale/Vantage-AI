import { logger } from "./logger";

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isServer = !isBrowser;
export const isWorker = typeof self !== 'undefined' && typeof window === 'undefined';

export function requireBrowser(feature: string): boolean {
  if (!isBrowser) {
    logger.warn(`Vantage AI: ${feature} requires a browser environment`);
    return false;
  }
  return true;
}
