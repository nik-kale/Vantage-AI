/**
 * Analytics Adapter Interface
 * All analytics integrations must implement this interface
 */
export interface AnalyticsAdapter {
  /** Adapter name */
  name: string;

  /** Initialize the adapter */
  init(config: any): Promise<void>;

  /** Track an event */
  track(event: string, properties?: Record<string, any>): void;

  /** Identify a user */
  identify(userId: string, traits?: Record<string, any>): void;

  /** Track a page view */
  page(name?: string, properties?: Record<string, any>): void;

  /** Track a group */
  group?(groupId: string, traits?: Record<string, any>): void;

  /** Alias a user */
  alias?(newId: string, previousId?: string): void;

  /** Flush queued events */
  flush?(): Promise<void>;

  /** Reset the adapter */
  reset?(): void;
}

/**
 * Base Analytics Manager
 */
export class AnalyticsManager {
  private adapters: Map<string, AnalyticsAdapter> = new Map();
  private enabled: boolean = true;

  addAdapter(adapter: AnalyticsAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  removeAdapter(name: string): void {
    this.adapters.delete(name);
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    for (const adapter of this.adapters.values()) {
      try {
        adapter.track(event, properties);
      } catch (error) {
        console.error(`Analytics adapter ${adapter.name} failed:`, error);
      }
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled) return;

    for (const adapter of this.adapters.values()) {
      try {
        adapter.identify(userId, traits);
      } catch (error) {
        console.error(`Analytics adapter ${adapter.name} failed:`, error);
      }
    }
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    for (const adapter of this.adapters.values()) {
      try {
        adapter.page(name, properties);
      } catch (error) {
        console.error(`Analytics adapter ${adapter.name} failed:`, error);
      }
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const adapter of this.adapters.values()) {
      if (adapter.flush) {
        promises.push(adapter.flush());
      }
    }

    await Promise.all(promises);
  }
}
