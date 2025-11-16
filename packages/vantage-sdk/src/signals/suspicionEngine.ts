import type {
  EventContext,
  SuspicionSignal,
  Playbook,
  Recommendation
} from "../types";

export class SuspicionEngine {
  private buffer: EventContext[] = [];
  private playbooks: Playbook[];

  constructor(playbooks: Playbook[]) {
    this.playbooks = playbooks;
  }

  addEvent(ctx: EventContext) {
    this.buffer.push(ctx);
    // Optional: trim buffer for memory
    if (this.buffer.length > 1000) {
      this.buffer.shift();
    }
  }

  evaluate(signal: SuspicionSignal): Recommendation | null {
    for (const pb of this.playbooks) {
      if (this.matchesPlaybook(signal, pb)) {
        return pb.recommendation;
      }
    }
    return null;
  }

  private matchesPlaybook(signal: SuspicionSignal, pb: Playbook): boolean {
    const { match } = pb;

    if (match.categories && !match.categories.includes(signal.category)) {
      return false;
    }

    if (typeof match.minScore === "number" && signal.score < match.minScore) {
      return false;
    }

    if (match.routePattern) {
      const latestRoute = signal.context.at(-1)?.route ?? "";
      const re = new RegExp(match.routePattern);
      if (!re.test(latestRoute)) return false;
    }

    if (match.containsText && match.containsText.length > 0) {
      const text = JSON.stringify(signal.context.map((c) => c.details));
      for (const needle of match.containsText) {
        if (!text.toLowerCase().includes(needle.toLowerCase())) {
          return false;
        }
      }
    }

    return true;
  }
}
