import type { EventContext } from "../types";

export class DomCollector {
  private route: string = window.location.pathname;
  private observer: MutationObserver | null = null;

  start(callback: (ctx: EventContext) => void) {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      const errorElements = document.querySelectorAll("[data-error], .error, .invalid");
      if (errorElements.length > 0) {
        const ctx: EventContext = {
          route: this.route,
          timestamp: Date.now(),
          eventType: "dom-error",
          details: {
            count: errorElements.length
          }
        };
        callback(ctx);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
