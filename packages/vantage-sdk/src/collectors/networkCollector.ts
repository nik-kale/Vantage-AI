import type { EventContext } from "../types";

export class NetworkCollector {
  private route: string = window.location.pathname;
  private originalFetch: typeof fetch;
  private originalXHR: typeof XMLHttpRequest;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHR = window.XMLHttpRequest;
  }

  start(callback: (ctx: EventContext) => void): void {
    // Intercept fetch
    window.fetch = async (...args) => {
      const start = Date.now();
      try {
        const response = await this.originalFetch(...args);
        const duration = Date.now() - start;

        if (!response.ok) {
          callback({
            route: this.route,
            timestamp: Date.now(),
            eventType: "network-error",
            details: {
              url: args[0],
              status: response.status,
              statusText: response.statusText,
              duration
            }
          });
        }

        return response;
      } catch (error) {
        callback({
          route: this.route,
          timestamp: Date.now(),
          eventType: "network-error",
          details: {
            url: args[0],
            error: error instanceof Error ? error.message : "Unknown error",
            duration: Date.now() - start
          }
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const self = this;
    const OriginalXHR = this.originalXHR;

    window.XMLHttpRequest = function () {
      const xhr = new OriginalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      let url: string = "";
      let start: number = 0;

      xhr.open = function (...args: any[]) {
        url = args[1] as string;
        return originalOpen.apply(this, args as any);
      };

      xhr.send = function (...args: any[]) {
        start = Date.now();

        xhr.addEventListener("load", function () {
          const duration = Date.now() - start;
          if (xhr.status >= 400) {
            callback({
              route: self.route,
              timestamp: Date.now(),
              eventType: "network-error",
              details: {
                url,
                status: xhr.status,
                statusText: xhr.statusText,
                duration
              }
            });
          }
        });

        xhr.addEventListener("error", function () {
          callback({
            route: self.route,
            timestamp: Date.now(),
            eventType: "network-error",
            details: {
              url,
              error: "Network request failed",
              duration: Date.now() - start
            }
          });
        });

        return originalSend.apply(this, args as any);
      };

      return xhr as XMLHttpRequest;
    } as any;
  }

  stop(): void {
    window.fetch = this.originalFetch;
    window.XMLHttpRequest = this.originalXHR;
  }
}
