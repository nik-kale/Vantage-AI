import type { AnalyticsAdapter } from "../core";

export interface GoogleAnalyticsConfig {
  measurementId: string;
}

/**
 * Google Analytics 4 Adapter
 */
export class GoogleAnalyticsAdapter implements AnalyticsAdapter {
  name = "google-analytics";
  private initialized = false;
  private measurementId: string = "";

  async init(config: GoogleAnalyticsConfig): Promise<void> {
    this.measurementId = config.measurementId;

    try {
      // Load GA4 script
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.measurementId}`;
      document.head.appendChild(script);

      // Initialize gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;

      gtag("js", new Date());
      gtag("config", config.measurementId);

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Google Analytics:", error);
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    (window as any).gtag("event", event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;
    (window as any).gtag("config", this.measurementId, {
      user_id: userId,
      ...traits
    });
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    (window as any).gtag("event", "page_view", {
      page_title: name,
      ...properties
    });
  }
}

export function createGoogleAnalyticsAdapter(config: GoogleAnalyticsConfig): GoogleAnalyticsAdapter {
  const adapter = new GoogleAnalyticsAdapter();
  adapter.init(config);
  return adapter;
}
