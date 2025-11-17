/**
 * @vantage-ai/angular
 * Angular integration for Vantage AI
 *
 * Provides Angular services, directives, and pipes for seamless Vantage AI integration
 */

import {
  Injectable,
  Directive,
  Pipe,
  PipeTransform,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  HostListener,
  InjectionToken,
  inject,
  ModuleWithProviders,
  NgModule
} from "@angular/core";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { takeUntil, map, filter } from "rxjs/operators";
import {
  initVantage,
  VantageConfig,
  VantageInstance,
  Recommendation
} from "@vantage-ai/sdk";

// =============================================================================
// Configuration Token
// =============================================================================

export const VANTAGE_CONFIG = new InjectionToken<VantageConfig>("VANTAGE_CONFIG");

// =============================================================================
// Core Vantage Service
// =============================================================================

@Injectable({
  providedIn: "root"
})
export class VantageService implements OnDestroy {
  private vantageInstance: VantageInstance | null = null;
  private destroy$ = new Subject<void>();

  private _isActive$ = new BehaviorSubject<boolean>(false);
  private _recommendations$ = new BehaviorSubject<Recommendation[]>([]);
  private _error$ = new BehaviorSubject<Error | null>(null);

  public readonly isActive$: Observable<boolean> = this._isActive$.asObservable();
  public readonly recommendations$: Observable<Recommendation[]> = this._recommendations$.asObservable();
  public readonly error$: Observable<Error | null> = this._error$.asObservable();

  constructor() {}

  /**
   * Initialize Vantage AI with configuration
   */
  init(config: VantageConfig): void {
    try {
      this.vantageInstance = initVantage({
        ...config,
        onTrigger: (rec) => {
          this._recommendations$.next([...this._recommendations$.value, rec]);
          config.onTrigger?.(rec);
        }
      });

      this._error$.next(null);
    } catch (error) {
      this._error$.next(error as Error);
      console.error("Failed to initialize Vantage:", error);
    }
  }

  /**
   * Start tracking
   */
  start(): void {
    if (!this.vantageInstance) {
      console.warn("Vantage not initialized. Call init() first.");
      return;
    }

    this.vantageInstance.start();
    this._isActive$.next(true);
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.vantageInstance) return;

    this.vantageInstance.stop();
    this._isActive$.next(false);
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.vantageInstance) return;

    this.vantageInstance.track(eventName, properties);
  }

  /**
   * Clear all recommendations
   */
  clearRecommendations(): void {
    this._recommendations$.next([]);
  }

  /**
   * Dismiss a specific recommendation
   */
  dismissRecommendation(id: string): void {
    const current = this._recommendations$.value;
    this._recommendations$.next(current.filter(rec => rec.id !== id));
  }

  /**
   * Get current Vantage instance
   */
  getInstance(): VantageInstance | null {
    return this.vantageInstance;
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.next();
    this.destroy$.complete();
    this._isActive$.complete();
    this._recommendations$.complete();
    this._error$.complete();
  }
}

// =============================================================================
// Recommendation Service
// =============================================================================

@Injectable({
  providedIn: "root"
})
export class RecommendationService {
  private vantageService = inject(VantageService);
  private _history$ = new BehaviorSubject<Recommendation[]>([]);

  public readonly current$: Observable<Recommendation | null>;
  public readonly history$: Observable<Recommendation[]> = this._history$.asObservable();

  constructor() {
    // Track the most recent recommendation
    this.current$ = this.vantageService.recommendations$.pipe(
      map(recs => recs.length > 0 ? recs[recs.length - 1] : null)
    );

    // Build history
    this.vantageService.recommendations$.subscribe(recs => {
      const allHistory = [...this._history$.value, ...recs];
      // Keep last 50 recommendations
      this._history$.next(allHistory.slice(-50));
    });
  }

  /**
   * Dismiss a recommendation
   */
  dismiss(id: string): void {
    this.vantageService.dismissRecommendation(id);
  }

  /**
   * Get recommendations by type
   */
  getByType(type: string): Observable<Recommendation[]> {
    return this.vantageService.recommendations$.pipe(
      map(recs => recs.filter(rec => rec.type === type))
    );
  }

  /**
   * Get recommendations by priority
   */
  getByPriority(priority: "low" | "medium" | "high"): Observable<Recommendation[]> {
    return this.vantageService.recommendations$.pipe(
      map(recs => recs.filter(rec => rec.priority === priority))
    );
  }
}

// =============================================================================
// Analytics Service
// =============================================================================

@Injectable({
  providedIn: "root"
})
export class AnalyticsService {
  private vantageService = inject(VantageService);

  /**
   * Track a custom event
   */
  track(event: string, properties?: Record<string, any>): void {
    this.vantageService.track(event, properties);
  }

  /**
   * Track page view
   */
  pageView(pageName: string, properties?: Record<string, any>): void {
    this.track("page_view", { page: pageName, ...properties });
  }

  /**
   * Track user action
   */
  action(actionName: string, properties?: Record<string, any>): void {
    this.track("user_action", { action: actionName, ...properties });
  }

  /**
   * Track conversion event
   */
  conversion(eventName: string, value?: number, properties?: Record<string, any>): void {
    this.track("conversion", {
      event: eventName,
      value,
      ...properties
    });
  }

  /**
   * Track error
   */
  error(error: Error, context?: Record<string, any>): void {
    this.track("error", {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
}

// =============================================================================
// Playbook Service
// =============================================================================

@Injectable({
  providedIn: "root"
})
export class PlaybookService {
  private vantageService = inject(VantageService);
  private _playbooks$ = new BehaviorSubject<any[]>([]);

  public readonly playbooks$: Observable<any[]> = this._playbooks$.asObservable();

  /**
   * Load playbooks
   */
  loadPlaybooks(playbooks: any[]): void {
    this._playbooks$.next(playbooks);

    const instance = this.vantageService.getInstance();
    if (instance) {
      // Re-initialize with new playbooks if needed
      console.log("Playbooks loaded:", playbooks.length);
    }
  }

  /**
   * Add a single playbook
   */
  addPlaybook(playbook: any): void {
    this._playbooks$.next([...this._playbooks$.value, playbook]);
  }

  /**
   * Remove a playbook by ID
   */
  removePlaybook(id: string): void {
    this._playbooks$.next(
      this._playbooks$.value.filter(p => p.id !== id)
    );
  }

  /**
   * Get playbook by ID
   */
  getPlaybook(id: string): any | null {
    return this._playbooks$.value.find(p => p.id === id) || null;
  }
}

// =============================================================================
// Directives
// =============================================================================

/**
 * Directive to track clicks and interactions
 * Usage: <button vantageTrack eventName="button_clicked" [eventProps]="{buttonId: 'cta'}">Click me</button>
 */
@Directive({
  selector: "[vantageTrack]",
  standalone: true
})
export class VantageTrackDirective {
  @Input() vantageTrack?: string; // Event name
  @Input() eventName?: string; // Alternative event name input
  @Input() eventProps?: Record<string, any>; // Event properties
  @Output() tracked = new EventEmitter<{ event: string; properties: any }>();

  private analyticsService = inject(AnalyticsService);

  @HostListener("click", ["$event"])
  onClick(event: MouseEvent): void {
    const name = this.vantageTrack || this.eventName || "element_clicked";
    const properties = {
      ...this.eventProps,
      timestamp: Date.now(),
      target: (event.target as HTMLElement)?.tagName
    };

    this.analyticsService.track(name, properties);
    this.tracked.emit({ event: name, properties });
  }
}

/**
 * Directive to mark elements as guidance targets
 * Usage: <div vantageTarget targetId="checkout-button" targetType="button">...</div>
 */
@Directive({
  selector: "[vantageTarget]",
  standalone: true
})
export class VantageTargetDirective implements OnInit {
  @Input() vantageTarget?: string; // Target ID
  @Input() targetId?: string; // Alternative target ID input
  @Input() targetType?: string; // Type of target (button, form, etc.)

  ngOnInit(): void {
    const id = this.vantageTarget || this.targetId;
    if (id) {
      // Mark element as guidance target
      // This can be used by the guidance system to attach tooltips, etc.
      console.log(`Vantage target registered: ${id} (${this.targetType || "unknown"})`);
    }
  }
}

// =============================================================================
// Pipes
// =============================================================================

/**
 * Filter recommendations by type
 * Usage: recommendations$ | async | vantageFilterByType:'banner'
 */
@Pipe({
  name: "vantageFilterByType",
  standalone: true
})
export class VantageFilterByTypePipe implements PipeTransform {
  transform(recommendations: Recommendation[] | null, type: string): Recommendation[] {
    if (!recommendations) return [];
    return recommendations.filter(rec => rec.type === type);
  }
}

/**
 * Filter recommendations by priority
 * Usage: recommendations$ | async | vantageFilterByPriority:'high'
 */
@Pipe({
  name: "vantageFilterByPriority",
  standalone: true
})
export class VantageFilterByPriorityPipe implements PipeTransform {
  transform(recommendations: Recommendation[] | null, priority: "low" | "medium" | "high"): Recommendation[] {
    if (!recommendations) return [];
    return recommendations.filter(rec => rec.priority === priority);
  }
}

/**
 * Sort recommendations by priority
 * Usage: recommendations$ | async | vantageSortByPriority
 */
@Pipe({
  name: "vantageSortByPriority",
  standalone: true
})
export class VantageSortByPriorityPipe implements PipeTransform {
  private priorityOrder = { high: 3, medium: 2, low: 1 };

  transform(recommendations: Recommendation[] | null): Recommendation[] {
    if (!recommendations) return [];
    return [...recommendations].sort((a, b) => {
      const priorityA = this.priorityOrder[a.priority || "low"];
      const priorityB = this.priorityOrder[b.priority || "low"];
      return priorityB - priorityA;
    });
  }
}

// =============================================================================
// Module
// =============================================================================

/**
 * Vantage Angular Module
 *
 * Usage:
 * ```typescript
 * import { VantageModule } from '@vantage-ai/angular';
 *
 * @NgModule({
 *   imports: [
 *     VantageModule.forRoot({
 *       mode: 'lite',
 *       playbooks: myPlaybooks
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({
  imports: [
    VantageTrackDirective,
    VantageTargetDirective,
    VantageFilterByTypePipe,
    VantageFilterByPriorityPipe,
    VantageSortByPriorityPipe
  ],
  exports: [
    VantageTrackDirective,
    VantageTargetDirective,
    VantageFilterByTypePipe,
    VantageFilterByPriorityPipe,
    VantageSortByPriorityPipe
  ]
})
export class VantageModule {
  static forRoot(config: VantageConfig): ModuleWithProviders<VantageModule> {
    return {
      ngModule: VantageModule,
      providers: [
        {
          provide: VANTAGE_CONFIG,
          useValue: config
        },
        VantageService,
        RecommendationService,
        AnalyticsService,
        PlaybookService
      ]
    };
  }
}

// =============================================================================
// Exports
// =============================================================================

export {
  VantageConfig,
  VantageInstance,
  Recommendation
} from "@vantage-ai/sdk";

export {
  VantageService,
  RecommendationService,
  AnalyticsService,
  PlaybookService,
  VantageTrackDirective,
  VantageTargetDirective,
  VantageFilterByTypePipe,
  VantageFilterByPriorityPipe,
  VantageSortByPriorityPipe,
  VantageModule,
  VANTAGE_CONFIG
};
