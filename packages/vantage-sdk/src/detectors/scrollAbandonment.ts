import type { EventContext, SuspicionSignal } from "../types";

interface ScrollEvent {
  position: number;
  timestamp: number;
  direction: "up" | "down";
}

const SCROLL_WINDOW_MS = 15000; // 15 seconds
const ABANDONMENT_THRESHOLD = 0.3; // 30% of page
const RAPID_SCROLL_COUNT = 5; // 5 rapid scrolls indicate scanning

export class ScrollAbandonmentDetector {
  private scrolls: ScrollEvent[] = [];
  private maxScrollPosition: number = 0;

  recordScroll(ctx: EventContext): SuspicionSignal | null {
    const position = (ctx.details.scrollPosition as number) || 0;
    const now = ctx.timestamp;

    const direction: "up" | "down" =
      this.scrolls.length > 0 && position < this.scrolls[this.scrolls.length - 1].position
        ? "up"
        : "down";

    this.scrolls.push({
      position,
      timestamp: now,
      direction
    });

    // Track max scroll depth
    if (position > this.maxScrollPosition) {
      this.maxScrollPosition = position;
    }

    // Keep only recent scrolls
    this.scrolls = this.scrolls.filter(
      (scroll) => now - scroll.timestamp <= SCROLL_WINDOW_MS
    );

    // Detect rapid scrolling (scanning behavior)
    if (this.scrolls.length >= RAPID_SCROLL_COUNT) {
      const timeSpan =
        this.scrolls[this.scrolls.length - 1].timestamp - this.scrolls[0].timestamp;

      if (timeSpan < 3000) {
        // Rapid scrolling in < 3 seconds
        const signal: SuspicionSignal = {
          id: `scroll-abandonment-${now}`,
          score: 0.6,
          category: "confusion",
          context: [
            {
              route: ctx.route,
              timestamp: now,
              eventType: "rapid-scroll",
              details: {
                scrollCount: this.scrolls.length,
                maxDepth: this.maxScrollPosition,
                timeSpan
              }
            }
          ]
        };

        this.clear();
        return signal;
      }
    }

    // Detect abandonment: user scrolled down then rapidly back up
    const recentScrolls = this.scrolls.slice(-10);
    const downScrolls = recentScrolls.filter((s) => s.direction === "down").length;
    const upScrolls = recentScrolls.filter((s) => s.direction === "up").length;

    if (upScrolls > downScrolls && this.maxScrollPosition > ABANDONMENT_THRESHOLD) {
      const signal: SuspicionSignal = {
        id: `scroll-abandonment-${now}`,
        score: Math.min(1, upScrolls / downScrolls),
        category: "confusion",
        context: [
          {
            route: ctx.route,
            timestamp: now,
            eventType: "scroll-abandonment",
            details: {
              maxDepth: this.maxScrollPosition,
              upScrolls,
              downScrolls
            }
          }
        ]
      };

      this.clear();
      return signal;
    }

    return null;
  }

  clear(): void {
    this.scrolls = [];
    this.maxScrollPosition = 0;
  }
}
