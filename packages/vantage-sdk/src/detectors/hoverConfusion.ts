import type { EventContext, SuspicionSignal } from "../types";

interface HoverEvent {
  element: string;
  timestamp: number;
  duration: number;
}

const HOVER_WINDOW_MS = 10000; // 10 seconds
const MIN_HOVER_DURATION = 500; // 500ms minimum hover
const CONFUSION_THRESHOLD = 5; // 5 different elements hovered

export class HoverConfusionDetector {
  private hovers: HoverEvent[] = [];
  private currentHover: { element: string; startTime: number } | null = null;

  recordHoverStart(ctx: EventContext): void {
    const element = (ctx.details.element as string) || "unknown";
    this.currentHover = {
      element,
      startTime: ctx.timestamp
    };
  }

  recordHoverEnd(ctx: EventContext): SuspicionSignal | null {
    if (!this.currentHover) {
      return null;
    }

    const duration = ctx.timestamp - this.currentHover.startTime;
    const now = ctx.timestamp;

    // Only record significant hovers
    if (duration >= MIN_HOVER_DURATION) {
      this.hovers.push({
        element: this.currentHover.element,
        timestamp: now,
        duration
      });
    }

    this.currentHover = null;

    // Keep only recent hovers
    this.hovers = this.hovers.filter(
      (hover) => now - hover.timestamp <= HOVER_WINDOW_MS
    );

    // Detect confusion: many different elements hovered in short time
    const uniqueElements = new Set(this.hovers.map((h) => h.element));

    if (uniqueElements.size >= CONFUSION_THRESHOLD) {
      const signal: SuspicionSignal = {
        id: `hover-confusion-${now}`,
        score: Math.min(1, uniqueElements.size / (CONFUSION_THRESHOLD * 2)),
        category: "confusion",
        context: this.hovers.map((hover) => ({
          route: ctx.route,
          timestamp: hover.timestamp,
          eventType: "hover",
          details: {
            element: hover.element,
            duration: hover.duration
          }
        }))
      };

      this.hovers = [];
      return signal;
    }

    return null;
  }

  clear(): void {
    this.hovers = [];
    this.currentHover = null;
  }
}
