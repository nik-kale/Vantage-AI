import type { VantageConfig, EventContext, Recommendation } from "./types";
import { RageClickDetector } from "./detectors/rageClicks";
import { SuspicionEngine } from "./signals/suspicionEngine";
import { DomCollector } from "./collectors/domCollector";

export class Vantage {
  private config: VantageConfig;
  private rageClickDetector: RageClickDetector;
  private suspicionEngine: SuspicionEngine;
  private domCollector: DomCollector;

  constructor(config: VantageConfig) {
    this.config = config;
    this.rageClickDetector = new RageClickDetector();
    this.suspicionEngine = new SuspicionEngine(config.playbooks ?? []);
    this.domCollector = new DomCollector();
  }

  start() {
    window.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const ctx: EventContext = {
        route: window.location.pathname,
        timestamp: Date.now(),
        eventType: "click",
        details: {
          tag: target?.tagName,
          id: target?.id,
          classes: target?.className
        }
      };

      this.handleClick(ctx);
    });

    this.domCollector.start((ctx) => {
      this.handleDomEvent(ctx);
    });
  }

  private handleClick(ctx: EventContext) {
    const signal = this.rageClickDetector.recordClick(ctx);
    this.suspicionEngine.addEvent(ctx);

    if (signal) {
      this.evaluateSignal(signal);
    }
  }

  private handleDomEvent(ctx: EventContext) {
    this.suspicionEngine.addEvent(ctx);
    // Future: trigger AI evaluation for certain dom-error events
  }

  private evaluateSignal(signal: any) {
    const recommendation: Recommendation | null =
      this.suspicionEngine.evaluate(signal);

    if (recommendation && this.config.onTrigger) {
      this.config.onTrigger(recommendation);
    }
  }
}

export function initVantage(config: VantageConfig): Vantage {
  const instance = new Vantage(config);
  return instance;
}

export * from "./types";
