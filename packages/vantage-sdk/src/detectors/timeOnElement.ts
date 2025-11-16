import type { EventContext, SuspicionSignal } from "../types";

interface ElementFocus {
  element: string;
  startTime: number;
  endTime?: number;
}

const EXCESSIVE_TIME_THRESHOLD = 30000; // 30 seconds on one element
const STUCK_THRESHOLD = 60000; // 60 seconds indicates user is stuck

export class TimeOnElementDetector {
  private currentFocus: ElementFocus | null = null;
  private focusHistory: ElementFocus[] = [];

  recordFocusStart(ctx: EventContext): void {
    const element = (ctx.details.element as string) || "unknown";

    // End previous focus if exists
    if (this.currentFocus) {
      this.currentFocus.endTime = ctx.timestamp;
      this.focusHistory.push(this.currentFocus);
    }

    this.currentFocus = {
      element,
      startTime: ctx.timestamp
    };
  }

  recordFocusEnd(ctx: EventContext): SuspicionSignal | null {
    if (!this.currentFocus) {
      return null;
    }

    const duration = ctx.timestamp - this.currentFocus.startTime;
    this.currentFocus.endTime = ctx.timestamp;
    this.focusHistory.push(this.currentFocus);

    const now = ctx.timestamp;

    // Detect excessive time on element
    if (duration >= EXCESSIVE_TIME_THRESHOLD) {
      const severity = duration >= STUCK_THRESHOLD ? 1 : 0.6;

      const signal: SuspicionSignal = {
        id: `time-on-element-${now}`,
        score: severity,
        category: "confusion",
        context: [
          {
            route: ctx.route,
            timestamp: now,
            eventType: "excessive-focus",
            details: {
              element: this.currentFocus.element,
              duration,
              isStuck: duration >= STUCK_THRESHOLD
            }
          }
        ]
      };

      this.currentFocus = null;
      return signal;
    }

    this.currentFocus = null;
    return null;
  }

  checkCurrentFocus(currentTime: number, route: string): SuspicionSignal | null {
    if (!this.currentFocus) {
      return null;
    }

    const duration = currentTime - this.currentFocus.startTime;

    if (duration >= EXCESSIVE_TIME_THRESHOLD) {
      const severity = duration >= STUCK_THRESHOLD ? 1 : 0.6;

      const signal: SuspicionSignal = {
        id: `time-on-element-${currentTime}`,
        score: severity,
        category: "confusion",
        context: [
          {
            route,
            timestamp: currentTime,
            eventType: "excessive-focus",
            details: {
              element: this.currentFocus.element,
              duration,
              isStuck: duration >= STUCK_THRESHOLD
            }
          }
        ]
      };

      this.currentFocus = null;
      return signal;
    }

    return null;
  }

  clear(): void {
    this.currentFocus = null;
    this.focusHistory = [];
  }
}
