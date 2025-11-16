import type { EventContext, SuspicionSignal } from "../types";

interface RageClickState {
  clicks: EventContext[];
}

const DEFAULT_WINDOW_MS = 5000;
const DEFAULT_THRESHOLD = 5;

export class RageClickDetector {
  private state: RageClickState = { clicks: [] };

  recordClick(ctx: EventContext): SuspicionSignal | null {
    const now = ctx.timestamp;
    this.state.clicks.push(ctx);

    this.state.clicks = this.state.clicks.filter(
      (c) => now - c.timestamp <= DEFAULT_WINDOW_MS
    );

    if (this.state.clicks.length >= DEFAULT_THRESHOLD) {
      const signal: SuspicionSignal = {
        id: `rage-click-${now}`,
        score: Math.min(1, this.state.clicks.length / (DEFAULT_THRESHOLD * 2)),
        category: "friction",
        context: [...this.state.clicks]
      };
      this.state.clicks = [];
      return signal;
    }

    return null;
  }
}
