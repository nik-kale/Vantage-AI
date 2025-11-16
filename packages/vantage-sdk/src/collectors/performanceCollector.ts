import type { EventContext } from "../types";

export class PerformanceCollector {
  private route: string = window.location.pathname;
  private observer: PerformanceObserver | null = null;

  start(callback: (ctx: EventContext) => void): void {
    if (!("PerformanceObserver" in window)) {
      console.warn("PerformanceObserver not supported");
      return;
    }

    try {
      // Observe long tasks
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "longtask" && entry.duration > 50) {
            callback({
              route: this.route,
              timestamp: Date.now(),
              eventType: "performance-longtask",
              details: {
                duration: entry.duration,
                startTime: entry.startTime
              }
            });
          }

          // Layout shifts
          if (entry.entryType === "layout-shift" && "value" in entry) {
            const shift = entry as PerformanceEntry & { value: number };
            if (shift.value > 0.1) {
              callback({
                route: this.route,
                timestamp: Date.now(),
                eventType: "performance-layout-shift",
                details: {
                  value: shift.value,
                  startTime: entry.startTime
                }
              });
            }
          }
        }
      });

      // Observe multiple entry types
      try {
        this.observer.observe({ entryTypes: ["longtask", "layout-shift"] });
      } catch (e) {
        // Fallback if entryTypes not supported
        console.warn("Some performance entry types not supported", e);
      }
    } catch (error) {
      console.warn("Failed to start PerformanceCollector", error);
    }
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
