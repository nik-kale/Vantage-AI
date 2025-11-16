/**
 * Performance utilities for optimization
 */

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Execute function during idle time
 */
export function runWhenIdle(callback: () => void, options?: IdleRequestOptions): void {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 1);
  }
}

/**
 * Memory-bounded buffer
 */
export class BoundedBuffer<T> {
  private buffer: T[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  push(item: T): void {
    this.buffer.push(item);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer = [];
  }

  get size(): number {
    return this.buffer.length;
  }
}

/**
 * Lazy loader for dynamic imports
 */
export class LazyLoader<T> {
  private loader: () => Promise<T>;
  private cached: T | null = null;
  private loading: Promise<T> | null = null;

  constructor(loader: () => Promise<T>) {
    this.loader = loader;
  }

  async load(): Promise<T> {
    if (this.cached) {
      return this.cached;
    }

    if (this.loading) {
      return this.loading;
    }

    this.loading = this.loader();
    this.cached = await this.loading;
    this.loading = null;

    return this.cached;
  }

  isLoaded(): boolean {
    return this.cached !== null;
  }

  reset(): void {
    this.cached = null;
    this.loading = null;
  }
}

/**
 * Performance monitor
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = performance.now() - start;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

/**
 * Deduplicator for recommendations
 */
export class Deduplicator<T> {
  private seen: Set<string> = new Set();
  private keyExtractor: (item: T) => string;
  private ttl: number;
  private timestamps: Map<string, number> = new Map();

  constructor(keyExtractor: (item: T) => string, ttl: number = 30000) {
    this.keyExtractor = keyExtractor;
    this.ttl = ttl;
  }

  isDuplicate(item: T): boolean {
    const key = this.keyExtractor(item);
    const now = Date.now();

    // Clean up expired entries
    for (const [k, timestamp] of this.timestamps.entries()) {
      if (now - timestamp > this.ttl) {
        this.seen.delete(k);
        this.timestamps.delete(k);
      }
    }

    if (this.seen.has(key)) {
      return true;
    }

    this.seen.add(key);
    this.timestamps.set(key, now);
    return false;
  }

  clear(): void {
    this.seen.clear();
    this.timestamps.clear();
  }
}
