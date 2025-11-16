import type { AnalyticsAdapter } from "../core";

export interface SegmentConfig {
  writeKey: string;
}

/**
 * Segment Analytics Adapter
 */
export class SegmentAdapter implements AnalyticsAdapter {
  name = "segment";
  private analytics: any;
  private initialized = false;

  async init(config: SegmentConfig): Promise<void> {
    try {
      // Load Segment snippet
      const snippet = () => {
        const analytics = (window.analytics = window.analytics || []);
        if (!analytics.initialize) {
          if (analytics.invoked) {
            window.console?.error?.("Segment snippet included twice.");
            return;
          }
          analytics.invoked = !0;
          analytics.methods = [
            "trackSubmit", "trackClick", "trackLink", "trackForm", "pageview",
            "identify", "reset", "group", "track", "ready", "alias", "debug",
            "page", "once", "off", "on", "addSourceMiddleware",
            "addIntegrationMiddleware", "setAnonymousId", "addDestinationMiddleware"
          ];
          analytics.factory = function (e: string) {
            return function (...args: any[]) {
              const t = Array.prototype.slice.call(args);
              t.unshift(e);
              analytics.push(t);
              return analytics;
            };
          };
          for (let e = 0; e < analytics.methods.length; e++) {
            const key = analytics.methods[e];
            analytics[key] = analytics.factory(key);
          }
          analytics.load = function (key: string, e: any) {
            const t = document.createElement("script");
            t.type = "text/javascript";
            t.async = !0;
            t.src = "https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";
            const n = document.getElementsByTagName("script")[0];
            n.parentNode?.insertBefore(t, n);
            analytics._loadOptions = e;
          };
          analytics.SNIPPET_VERSION = "4.13.2";
          analytics.load(config.writeKey);
        }
        return analytics;
      };

      this.analytics = snippet();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Segment:", error);
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.analytics.track(event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;
    this.analytics.identify(userId, traits);
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.analytics.page(name, properties);
  }

  group(groupId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;
    this.analytics.group(groupId, traits);
  }

  alias(newId: string, previousId?: string): void {
    if (!this.initialized) return;
    this.analytics.alias(newId, previousId);
  }

  reset(): void {
    if (!this.initialized) return;
    this.analytics.reset();
  }
}

export function createSegmentAdapter(config: SegmentConfig): SegmentAdapter {
  const adapter = new SegmentAdapter();
  adapter.init(config);
  return adapter;
}
