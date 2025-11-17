import type { AnalyticsAdapter } from "../core";

export interface PostHogConfig {
  apiKey: string;
  apiHost?: string;
}

/**
 * PostHog Analytics Adapter
 */
export class PostHogAdapter implements AnalyticsAdapter {
  name = "posthog";
  private posthog: any;
  private initialized = false;

  async init(config: PostHogConfig): Promise<void> {
    try {
      // Dynamically import PostHog SDK
      const posthogModule = await import("posthog-js");
      this.posthog = posthogModule.default;

      this.posthog.init(config.apiKey, {
        api_host: config.apiHost || "https://app.posthog.com",
        loaded: () => {
          this.initialized = true;
        }
      });
    } catch (error) {
      console.error("Failed to initialize PostHog:", error);
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.posthog.capture(event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;

    this.posthog.identify(userId, traits);
  }

  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) return;
    this.posthog.capture("$pageview", { page: name, ...properties });
  }

  group(groupId: string, traits?: Record<string, any>): void {
    if (!this.initialized) return;
    this.posthog.group("company", groupId, traits);
  }

  alias(newId: string, previousId?: string): void {
    if (!this.initialized) return;
    this.posthog.alias(newId, previousId);
  }

  reset(): void {
    if (!this.initialized) return;
    this.posthog.reset();
  }
}

export function createPostHogAdapter(config: PostHogConfig): PostHogAdapter {
  const adapter = new PostHogAdapter();
  adapter.init(config);
  return adapter;
}
