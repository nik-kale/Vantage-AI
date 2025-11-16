import type { EventContext, SuspicionSignal } from "../types";

interface ErrorEvent {
  type: string;
  message: string;
  timestamp: number;
}

const CASCADE_WINDOW_MS = 10000; // 10 seconds
const CASCADE_THRESHOLD = 3; // 3 errors in quick succession

export class ErrorCascadeDetector {
  private errors: ErrorEvent[] = [];

  recordError(ctx: EventContext): SuspicionSignal | null {
    const now = ctx.timestamp;
    const errorType = (ctx.details.errorType as string) || "unknown";
    const errorMessage = (ctx.details.message as string) || "";

    this.errors.push({
      type: errorType,
      message: errorMessage,
      timestamp: now
    });

    // Keep only recent errors
    this.errors = this.errors.filter(
      (error) => now - error.timestamp <= CASCADE_WINDOW_MS
    );

    // Detect cascade
    if (this.errors.length >= CASCADE_THRESHOLD) {
      const signal: SuspicionSignal = {
        id: `error-cascade-${now}`,
        score: Math.min(1, this.errors.length / (CASCADE_THRESHOLD * 2)),
        category: "error",
        context: this.errors.map((error) => ({
          route: ctx.route,
          timestamp: error.timestamp,
          eventType: "error",
          details: {
            errorType: error.type,
            message: error.message
          }
        }))
      };

      this.errors = [];
      return signal;
    }

    return null;
  }

  clear(): void {
    this.errors = [];
  }
}
