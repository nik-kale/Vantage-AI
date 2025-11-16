import type { EventContext, SuspicionSignal } from "../types";

interface NavigationEvent {
  route: string;
  timestamp: number;
  direction?: "forward" | "back";
}

const LOOP_DETECTION_WINDOW = 60000; // 1 minute
const MIN_LOOP_SIZE = 2; // Minimum routes in a loop
const LOOP_THRESHOLD = 3; // Number of times to repeat the pattern

export class NavigationLoopDetector {
  private history: NavigationEvent[] = [];

  recordNavigation(ctx: EventContext): SuspicionSignal | null {
    const now = ctx.timestamp;
    const route = ctx.route;

    this.history.push({
      route,
      timestamp: now,
      direction: ctx.details.direction as "forward" | "back" | undefined
    });

    // Keep only recent history
    this.history = this.history.filter(
      (nav) => now - nav.timestamp <= LOOP_DETECTION_WINDOW
    );

    // Detect loops
    const loop = this.detectLoopPattern();
    if (loop) {
      const signal: SuspicionSignal = {
        id: `nav-loop-${now}`,
        score: Math.min(1, loop.count / (LOOP_THRESHOLD * 2)),
        category: "confusion",
        context: loop.events.map((nav) => ({
          route: nav.route,
          timestamp: nav.timestamp,
          eventType: "navigation",
          details: { direction: nav.direction }
        }))
      };

      // Clear history after detecting loop
      this.history = [];
      return signal;
    }

    return null;
  }

  private detectLoopPattern(): { events: NavigationEvent[]; count: number } | null {
    if (this.history.length < MIN_LOOP_SIZE * LOOP_THRESHOLD) {
      return null;
    }

    // Look for repeated patterns
    for (let patternSize = MIN_LOOP_SIZE; patternSize <= Math.floor(this.history.length / 2); patternSize++) {
      const pattern = this.history.slice(0, patternSize).map((n) => n.route);
      let repetitions = 0;

      for (let i = patternSize; i <= this.history.length - patternSize; i += patternSize) {
        const segment = this.history.slice(i, i + patternSize).map((n) => n.route);
        if (this.arraysEqual(pattern, segment)) {
          repetitions++;
        } else {
          break;
        }
      }

      if (repetitions >= LOOP_THRESHOLD - 1) {
        return {
          events: this.history.slice(0, patternSize * LOOP_THRESHOLD),
          count: repetitions + 1
        };
      }
    }

    return null;
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }

  clear(): void {
    this.history = [];
  }
}
