import type { AnalyticsAdapter } from "../core";

export interface HeapConfig {
  appId: string;
}

/**
 * Heap Analytics Adapter
 */
export class HeapAdapter implements AnalyticsAdapter {
  name = "heap";
  private heap: any;
  private initialized = false;

  async init(config: HeapConfig): Promise<void> {
    try {
      // Load Heap snippet
      (window as any).heap = (window as any).heap || [];
      (window as any).heap.load = function (e: string, t?: any) {
        (window as any).heap.appid = e;
        (window as any).heap.config = t = t || {};

        const r = document.createElement("script");
        r.type = "text/javascript";
        r.async = true;
        r.src = "https://cdn.heapanalytics.com/js/heap-" + e + ".js";

        const a = document.getElementsByTagName("script")[0];
        a.parentNode?.insertBefore(r, a);

        const methods = [
          "addEventProperties", "addUserProperties", "clearEventProperties",
          "identify", "resetIdentity", "removeEventProperty", "setEventProperties",
          "track", "unsetEventProperty"
        ];

        for (let i = 0; i < methods.length; i++) {
          (window as any).heap[methods[i]] = (function (methodName: string) {
            return function (...args: any[]) {
              (window as any).heap.push([methodName].concat(Array.prototype.slice.call(args, 0)));
            };
          })(methods[i]);
        }
      };

      (window as any).heap.load(config.appId);
      this.heap = (window as any).heap;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Heap:", error);
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.heap.track(event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;

    this.heap.identify(userId);

    if (traits) {
      this.heap.addUserProperties(traits);
    }
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.track("Page Viewed", { page: name, ...properties });
  }

  reset(): void {
    if (!this.initialized) return;
    this.heap.resetIdentity();
  }
}

export function createHeapAdapter(config: HeapConfig): HeapAdapter {
  const adapter = new HeapAdapter();
  adapter.init(config);
  return adapter;
}
