import type { EventContext, SuspicionSignal } from "../types";

interface ClickEvent {
  element: string;
  timestamp: number;
  hadEffect: boolean;
}

const DEAD_CLICK_WINDOW = 5000; // 5 seconds
const DEAD_CLICK_THRESHOLD = 3; // 3 clicks with no effect

export class DeadClickDetector {
  private clicks: ClickEvent[] = [];

  recordClick(ctx: EventContext, hadEffect: boolean = false): SuspicionSignal | null {
    const element = (ctx.details.element as string) || "unknown";
    const now = ctx.timestamp;

    this.clicks.push({
      element,
      timestamp: now,
      hadEffect
    });

    // Keep only recent clicks
    this.clicks = this.clicks.filter(
      (click) => now - click.timestamp <= DEAD_CLICK_WINDOW
    );

    // Count dead clicks (clicks with no effect)
    const deadClicks = this.clicks.filter((c) => !c.hadEffect);

    if (deadClicks.length >= DEAD_CLICK_THRESHOLD) {
      const signal: SuspicionSignal = {
        id: `dead-click-${now}`,
        score: Math.min(1, deadClicks.length / (DEAD_CLICK_THRESHOLD * 2)),
        category: "friction",
        context: deadClicks.map((click) => ({
          route: ctx.route,
          timestamp: click.timestamp,
          eventType: "dead-click",
          details: {
            element: click.element
          }
        }))
      };

      this.clicks = [];
      return signal;
    }

    return null;
  }

  clear(): void {
    this.clicks = [];
  }
}
