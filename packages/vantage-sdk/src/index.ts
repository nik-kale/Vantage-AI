import type { VantageConfig, EventContext, Recommendation } from "./types";
import { RageClickDetector } from "./detectors/rageClicks";
import { DeadClickDetector } from "./detectors/deadClicks";
import { ErrorCascadeDetector } from "./detectors/errorCascade";
import { FormFailureDetector } from "./detectors/formFailures";
import { HoverConfusionDetector } from "./detectors/hoverConfusion";
import { NavigationLoopDetector } from "./detectors/navigationLoops";
import { ScrollAbandonmentDetector } from "./detectors/scrollAbandonment";
import { TimeOnElementDetector } from "./detectors/timeOnElement";

import { SuspicionEngine } from "./signals/suspicionEngine";
import { DomCollector } from "./collectors/domCollector";
import { ErrorCollector } from "./collectors/errorCollector";

export class Vantage {
  private config: VantageConfig;
  
  // Detectors
  private rageClickDetector: RageClickDetector;
  private deadClickDetector: DeadClickDetector;
  private errorCascadeDetector: ErrorCascadeDetector;
  private formFailureDetector: FormFailureDetector;
  private hoverConfusionDetector: HoverConfusionDetector;
  private navigationLoopDetector: NavigationLoopDetector;
  private scrollAbandonmentDetector: ScrollAbandonmentDetector;
  private timeOnElementDetector: TimeOnElementDetector;

  private suspicionEngine: SuspicionEngine;
  private domCollector: DomCollector;
  private errorCollector: ErrorCollector;

  constructor(config: VantageConfig) {
    this.config = config;
    
    // Initialize detectors
    this.rageClickDetector = new RageClickDetector();
    this.deadClickDetector = new DeadClickDetector();
    this.errorCascadeDetector = new ErrorCascadeDetector();
    this.formFailureDetector = new FormFailureDetector();
    this.hoverConfusionDetector = new HoverConfusionDetector();
    this.navigationLoopDetector = new NavigationLoopDetector();
    this.scrollAbandonmentDetector = new ScrollAbandonmentDetector();
    this.timeOnElementDetector = new TimeOnElementDetector();

    this.suspicionEngine = new SuspicionEngine(config.playbooks ?? []);
    this.domCollector = new DomCollector();
    this.errorCollector = new ErrorCollector();
  }

  start() {
    // 1. Click Handling (Rage Clicks & Dead Clicks)
    window.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const ctx: EventContext = {
        route: window.location.pathname,
        timestamp: Date.now(),
        eventType: "click",
        details: {
          tag: target?.tagName,
          id: target?.id,
          classes: target?.className,
          element: target?.tagName?.toLowerCase() // useful for other detectors
        }
      };

      this.handleClick(ctx, target);
    });

    // 2. DOM Mutation Monitoring
    this.domCollector.start((ctx) => {
      this.handleDomEvent(ctx);
    });

    // 3. Error Monitoring (Error Cascade)
    this.errorCollector.start((ctx) => {
      this.handleErrorEvent(ctx);
    });

    // 4. Form Interactions (Form Failure)
    // Capture 'invalid' events for form validation errors
    window.addEventListener("invalid", (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        // Find parent form
        const form = target.closest("form");
        this.handleFormEvent(target, form, true);
      }
    }, true); // Capture phase is required for 'invalid' event

    // Capture 'submit' events
    window.addEventListener("submit", (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        const form = target instanceof HTMLFormElement ? target : target.closest("form");
        // We assume submit is successful initially (no error), unless we see invalid events
        this.handleFormEvent(target, form, false);
      }
    });

    // 5. Navigation Monitoring (Navigation Loops)
    this.setupNavigationMonitoring();

    // 6. Hover Monitoring (Hover Confusion)
    this.setupHoverMonitoring();

    // 7. Scroll Monitoring (Scroll Abandonment)
    this.setupScrollMonitoring();

    // 8. Focus Monitoring (Time On Element)
    this.setupFocusMonitoring();
  }

  private handleClick(ctx: EventContext, target: HTMLElement | null) {
    // Rage Clicks
    const rageSignal = this.rageClickDetector.recordClick(ctx);
    if (rageSignal) this.evaluateSignal(rageSignal);

    // Dead Clicks - check if element is interactive or changed something
    // This is a simplified heuristic. In a real app we might check if DOM changed or URL changed.
    // For now, we assume 'hadEffect' is false unless we prove otherwise (hooks could update this).
    // In this basic version, we just pass false to let the detector aggregate.
    const deadSignal = this.deadClickDetector.recordClick(ctx, false); 
    if (deadSignal) this.evaluateSignal(deadSignal);

    this.suspicionEngine.addEvent(ctx);
  }

  private handleDomEvent(ctx: EventContext) {
    this.suspicionEngine.addEvent(ctx);
  }

  private handleErrorEvent(ctx: EventContext) {
    const signal = this.errorCascadeDetector.recordError(ctx);
    if (signal) this.evaluateSignal(signal);
    this.suspicionEngine.addEvent(ctx);
  }

  private handleFormEvent(target: HTMLElement, form: HTMLFormElement | null, hasErrors: boolean) {
    const ctx: EventContext = {
      route: window.location.pathname,
      timestamp: Date.now(),
      eventType: hasErrors ? "form-invalid" : "form-submit",
      details: {
        formId: form?.id || form?.name || "unknown-form",
        element: target.tagName.toLowerCase(),
        hasErrors
      }
    };
    
    const signal = this.formFailureDetector.recordSubmit(ctx);
    if (signal) this.evaluateSignal(signal);
    this.suspicionEngine.addEvent(ctx);
  }

  private setupNavigationMonitoring() {
    const handleNav = (direction?: "forward" | "back") => {
      const ctx: EventContext = {
        route: window.location.pathname,
        timestamp: Date.now(),
        eventType: "navigation",
        details: { direction }
      };
      const signal = this.navigationLoopDetector.recordNavigation(ctx);
      if (signal) this.evaluateSignal(signal);
      this.suspicionEngine.addEvent(ctx);
    };

    window.addEventListener("popstate", () => handleNav("back"));
    
    // Monkeypatch pushState/replaceState
    const originalPushState = history.pushState;
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      handleNav("forward");
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      handleNav("forward");
    };
  }

  private setupHoverMonitoring() {
    window.addEventListener("mouseover", (e) => {
      const target = e.target as HTMLElement;
      const ctx: EventContext = {
        route: window.location.pathname,
        timestamp: Date.now(),
        eventType: "hover-start",
        details: { element: target.tagName.toLowerCase() }
      };
      this.hoverConfusionDetector.recordHoverStart(ctx);
    });

    window.addEventListener("mouseout", (e) => {
      const target = e.target as HTMLElement;
      const ctx: EventContext = {
        route: window.location.pathname,
        timestamp: Date.now(),
        eventType: "hover-end",
        details: { element: target.tagName.toLowerCase() }
      };
      const signal = this.hoverConfusionDetector.recordHoverEnd(ctx);
      if (signal) this.evaluateSignal(signal);
    });
  }

  private setupScrollMonitoring() {
    let scrollTimeout: any;
    window.addEventListener("scroll", () => {
        if (scrollTimeout) return;
        
        scrollTimeout = setTimeout(() => {
            const ctx: EventContext = {
                route: window.location.pathname,
                timestamp: Date.now(),
                eventType: "scroll",
                details: { 
                    scrollPosition: window.scrollY,
                    viewportHeight: window.innerHeight
                }
            };
            const signal = this.scrollAbandonmentDetector.recordScroll(ctx);
            if (signal) this.evaluateSignal(signal);
            scrollTimeout = null;
        }, 100); // Throttle
    });
  }

  private setupFocusMonitoring() {
    // Using focusin/focusout as primary means, but could be enhanced with IntersectionObserver
    window.addEventListener("focusin", (e) => {
        const target = e.target as HTMLElement;
        const ctx: EventContext = {
            route: window.location.pathname,
            timestamp: Date.now(),
            eventType: "focus-start",
            details: { element: target.tagName.toLowerCase() }
        };
        this.timeOnElementDetector.recordFocusStart(ctx);
    });

    window.addEventListener("focusout", (e) => {
        const target = e.target as HTMLElement;
        const ctx: EventContext = {
            route: window.location.pathname,
            timestamp: Date.now(),
            eventType: "focus-end",
            details: { element: target.tagName.toLowerCase() }
        };
        const signal = this.timeOnElementDetector.recordFocusEnd(ctx);
        if (signal) this.evaluateSignal(signal);
    });
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
