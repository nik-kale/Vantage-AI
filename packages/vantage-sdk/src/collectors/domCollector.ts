import type { EventContext } from "../types";

export class DomCollector {
  private route: string = window.location.pathname;

  start(callback: (ctx: EventContext) => void) {
    const observer = new MutationObserver(() => {
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

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }
}
