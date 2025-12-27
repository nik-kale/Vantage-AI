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
import { OfflineBuffer } from "./utils/offlineBuffer";
import { isBrowser } from "./utils/environment";
import { logger } from "./utils/logger";

interface StoredListener {
  type: string;
  handler: EventListenerOrEventListenerObject;
  target: EventTarget;
  options?: boolean | AddEventListenerOptions;
}

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
  private offlineBuffer: OfflineBuffer | null = null;

  // Lifecycle
  private isRunning = false;
  private listeners: StoredListener[] = [];
  private originalPushState: ((...args: any[]) => void) | null = null;
  private originalReplaceState: ((...args: any[]) => void) | null = null;

  constructor(config: VantageConfig) {
    this.config = config;

    if (config.logger) {
        logger.configure(config.logger);
    }
    
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

    if (config.offline?.enabled && isBrowser) {
      this.offlineBuffer = new OfflineBuffer(config.offline);
      this.offlineBuffer.init();
    }
  }

  start() {
    if (!isBrowser) {
        logger.warn('Vantage: Start called in non-browser environment');
        return;
    }

    if (this.isRunning) return;
    this.isRunning = true;

    // Offline Handling
    if (this.offlineBuffer) {
      this.addListener(window, "online", () => this.flushOfflineEvents());
    }

    // 1. Click Handling (Rage Clicks & Dead Clicks)
    this.addListener(window, "click", (e) => {
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
    this.addListener(window, "invalid", (e) => {
      const target = e.target as HTMLElement;
      if (target) {
        // Find parent form
        const form = target.closest("form");
        this.handleFormEvent(target, form, true);
      }
    }, true); // Capture phase is required for 'invalid' event

    // Capture 'submit' events
    this.addListener(window, "submit", (e) => {
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

  stop() {
    if (!this.isRunning) return;

    // Remove all listeners
    this.listeners.forEach(({ target, type, handler, options }) => {
      target.removeEventListener(type, handler, options);
    });
    this.listeners = [];

    // Stop collectors
    this.domCollector.stop();
    this.errorCollector.stop();

    // Restore history methods
    if (this.originalPushState) {
      history.pushState = this.originalPushState;
      this.originalPushState = null;
    }
    if (this.originalReplaceState) {
      history.replaceState = this.originalReplaceState;
      this.originalReplaceState = null;
    }

    this.isRunning = false;
  }

  destroy() {
    this.stop();
    
    // Clear state in detectors
    this.rageClickDetector.clear();
    this.deadClickDetector.clear();
    this.errorCascadeDetector.clear();
    this.formFailureDetector.clear();
    this.hoverConfusionDetector.clear();
    this.navigationLoopDetector.clear();
    this.scrollAbandonmentDetector.clear();
    this.timeOnElementDetector.clear();
    
    this.suspicionEngine.clear();
  }

  private addListener(
    target: EventTarget, 
    type: string, 
    handler: EventListenerOrEventListenerObject, 
    options?: boolean | AddEventListenerOptions
  ) {
    target.addEventListener(type, handler, options);
    this.listeners.push({ target, type, handler, options });
  }

  private processEvent(ctx: EventContext) {
    if (this.offlineBuffer && !navigator.onLine) {
        this.offlineBuffer.add(ctx);
    }
    this.suspicionEngine.addEvent(ctx);
  }

  private async flushOfflineEvents() {
    if (!this.offlineBuffer || !this.config.offline?.onFlush) return;
    try {
        const events = await this.offlineBuffer.popAll();
        if (events.length > 0) {
            this.config.offline.onFlush(events);
        }
    } catch (e) {
        logger.warn("Vantage: Failed to flush offline events", e);
    }
  }

  private handleClick(ctx: EventContext, target: HTMLElement | null) {
    // Rage Clicks
    const rageSignal = this.rageClickDetector.recordClick(ctx);
    if (rageSignal) this.evaluateSignal(rageSignal);

    // Dead Clicks
    const deadSignal = this.deadClickDetector.recordClick(ctx, false); 
    if (deadSignal) this.evaluateSignal(deadSignal);

    this.processEvent(ctx);
  }

  private handleDomEvent(ctx: EventContext) {
    this.processEvent(ctx);
  }

  private handleErrorEvent(ctx: EventContext) {
    const signal = this.errorCascadeDetector.recordError(ctx);
    if (signal) this.evaluateSignal(signal);
    this.processEvent(ctx);
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
    this.processEvent(ctx);
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
      this.processEvent(ctx);
    };

    this.addListener(window, "popstate", () => handleNav("back"));
    
    // Monkeypatch pushState/replaceState
    if (!this.originalPushState) {
        this.originalPushState = history.pushState;
        history.pushState = (...args) => {
            this.originalPushState?.apply(history, args);
            handleNav("forward");
        };
    }

    if (!this.originalReplaceState) {
        this.originalReplaceState = history.replaceState;
        history.replaceState = (...args) => {
            this.originalReplaceState?.apply(history, args);
            handleNav("forward");
        };
    }
  }

  private setupHoverMonitoring() {
    this.addListener(window, "mouseover", (e) => {
      const target = e.target as HTMLElement;
      const ctx: EventContext = {
        route: window.location.pathname,
        timestamp: Date.now(),
        eventType: "hover-start",
        details: { element: target.tagName.toLowerCase() }
      };
      this.hoverConfusionDetector.recordHoverStart(ctx);
    });

    this.addListener(window, "mouseout", (e) => {
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
    const scrollHandler = () => {
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
    };
    
    this.addListener(window, "scroll", scrollHandler);
  }

  private setupFocusMonitoring() {
    this.addListener(window, "focusin", (e) => {
        const target = e.target as HTMLElement;
        const ctx: EventContext = {
            route: window.location.pathname,
            timestamp: Date.now(),
            eventType: "focus-start",
            details: { element: target.tagName.toLowerCase() }
        };
        this.timeOnElementDetector.recordFocusStart(ctx);
    });

    this.addListener(window, "focusout", (e) => {
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
export { logger, Logger, LogLevel, LoggerConfig } from "./utils/logger";
