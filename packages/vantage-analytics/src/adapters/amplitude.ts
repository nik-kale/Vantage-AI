import type { AnalyticsAdapter } from "../core";

export interface AmplitudeConfig {
  apiKey: string;
  userId?: string;
  serverUrl?: string;
}

/**
 * Amplitude Analytics Adapter
 */
export class AmplitudeAdapter implements AnalyticsAdapter {
  name = "amplitude";
  private amplitude: any;
  private initialized = false;

  async init(config: AmplitudeConfig): Promise<void> {
    try {
      // Dynamically import Amplitude SDK
      const amplitudeModule = await import("@amplitude/analytics-browser");
      this.amplitude = amplitudeModule;

      await this.amplitude.init(config.apiKey, config.userId, {
        serverUrl: config.serverUrl
      });

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize Amplitude:", error);
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.amplitude.track(event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;

    const identifyObj = new this.amplitude.Identify();
    if (traits) {
      Object.entries(traits).forEach(([key, value]) => {
        identifyObj.set(key, value);
      });
    }

    this.amplitude.identify(identifyObj);
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.track("Page Viewed", { page: name, ...properties });
  }

  async flush(): Promise<void> {
    if (!this.initialized) return;
    await this.amplitude.flush();
  }

  reset(): void {
    if (!this.initialized) return;
    this.amplitude.reset();
  }
}

export function createAmplitudeAdapter(config: AmplitudeConfig): AmplitudeAdapter {
  const adapter = new AmplitudeAdapter();
  adapter.init(config);
  return adapter;
}
