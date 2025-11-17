import type { AnalyticsAdapter } from "../core";

export interface MixpanelConfig {
  token: string;
  apiHost?: string;
}

/**
 * Mixpanel Analytics Adapter
 */
export class MixpanelAdapter implements AnalyticsAdapter {
  name = "mixpanel";
  private mixpanel: any;
  private initialized = false;

  async init(config: MixpanelConfig): Promise<void> {
    try {
      // Load Mixpanel snippet
      const snippet = () => {
        const mixpanel = (window as any).mixpanel = (window as any).mixpanel || [];

        if (!mixpanel.__loaded) {
          mixpanel.__loaded = true;
          mixpanel.people = mixpanel.people || [];
          mixpanel.toString = () => "[object Mixpanel]";

          const methods = [
            "alias", "track", "track_links", "track_forms", "register",
            "register_once", "unregister", "identify", "name_tag",
            "set_config", "reset", "people.set", "people.set_once",
            "people.unset", "people.increment", "people.append",
            "people.union", "people.track_charge", "people.clear_charges",
            "people.delete_user"
          ];

          methods.forEach((method) => {
            mixpanel[method] = function (...args: any[]) {
              mixpanel.push([method].concat(args));
            };
          });

          const script = document.createElement("script");
          script.type = "text/javascript";
          script.async = true;
          script.src = "https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";

          script.onload = () => {
            (window as any).mixpanel.init(config.token, {
              api_host: config.apiHost || "https://api.mixpanel.com"
            });
          };

          const first = document.getElementsByTagName("script")[0];
          first.parentNode?.insertBefore(script, first);
        }

        return mixpanel;
      };

      this.mixpanel = snippet();
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Mixpanel:", error);
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.mixpanel.track(event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;

    this.mixpanel.identify(userId);

    if (traits) {
      this.mixpanel.people.set(traits);
    }
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.track("Page Viewed", { page: name, ...properties });
  }

  reset(): void {
    if (!this.initialized) return;
    this.mixpanel.reset();
  }
}

export function createMixpanelAdapter(config: MixpanelConfig): MixpanelAdapter {
  const adapter = new MixpanelAdapter();
  adapter.init(config);
  return adapter;
}
