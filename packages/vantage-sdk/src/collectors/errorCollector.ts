import type { EventContext } from "../types";
import { isBrowser } from "../utils/environment";

export class ErrorCollector {
  private route: string = isBrowser ? window.location.pathname : "";
  private errorHandler: ((event: ErrorEvent) => void) | null = null;
  private rejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  start(callback: (ctx: EventContext) => void): void {
    if (!isBrowser) return;
    
    // Global error handler
    this.errorHandler = (event: ErrorEvent) => {
      callback({
        route: this.route,
        timestamp: Date.now(),
        eventType: "javascript-error",
        details: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack || event.error?.toString()
        }
      });
    };

    // Unhandled promise rejection handler
    this.rejectionHandler = (event: PromiseRejectionEvent) => {
      callback({
        route: this.route,
        timestamp: Date.now(),
        eventType: "unhandled-rejection",
        details: {
          reason: event.reason instanceof Error ? event.reason.message : String(event.reason),
          stack: event.reason instanceof Error ? event.reason.stack : undefined
        }
      });
    };

    window.addEventListener("error", this.errorHandler);
    window.addEventListener("unhandledrejection", this.rejectionHandler);
  }

  stop(): void {
    if (this.errorHandler) {
      window.removeEventListener("error", this.errorHandler);
      this.errorHandler = null;
    }
    if (this.rejectionHandler) {
      window.removeEventListener("unhandledrejection", this.rejectionHandler);
      this.rejectionHandler = null;
    }
  }
}
