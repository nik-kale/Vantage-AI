/**
 * Heatmaps - Visualize User Behavior
 * Click heatmaps, scroll heatmaps, attention heatmaps, rage click heatmaps
 */

export interface HeatmapConfig {
  /** Heatmap type */
  type: "click" | "scroll" | "attention" | "rage" | "dead";
  /** Container element */
  container?: HTMLElement;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Max data points */
  maxDataPoints?: number;
  /** Color scheme */
  colorScheme?: "hot" | "cool" | "rainbow";
  /** Opacity (0-1) */
  opacity?: number;
}

export interface HeatmapDataPoint {
  x: number;
  y: number;
  weight?: number;
  timestamp?: number;
  element?: string;
}

export interface HeatmapData {
  type: string;
  dataPoints: HeatmapDataPoint[];
  viewport: { width: number; height: number };
  url: string;
  collectedAt: number;
}

/**
 * Base Heatmap Class
 */
export abstract class BaseHeatmap {
  protected config: Required<HeatmapConfig>;
  protected dataPoints: HeatmapDataPoint[] = [];
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;
  protected isTracking = false;

  constructor(config: HeatmapConfig) {
    this.config = {
      type: config.type,
      container: config.container || document.body,
      sampleRate: config.sampleRate ?? 1.0,
      maxDataPoints: config.maxDataPoints ?? 10000,
      colorScheme: config.colorScheme ?? "hot",
      opacity: config.opacity ?? 0.6
    };
  }

  /**
   * Start tracking
   */
  abstract startTracking(): void;

  /**
   * Stop tracking
   */
  stopTracking(): void {
    this.isTracking = false;
  }

  /**
   * Get collected data
   */
  getData(): HeatmapData {
    return {
      type: this.config.type,
      dataPoints: this.dataPoints,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      url: window.location.href,
      collectedAt: Date.now()
    };
  }

  /**
   * Render heatmap
   */
  render(data?: HeatmapData): void {
    const renderData = data || this.getData();

    if (!this.canvas) {
      this.createCanvas();
    }

    this.clearCanvas();
    this.drawHeatmap(renderData.dataPoints);
  }

  /**
   * Export data as JSON
   */
  export(): string {
    return JSON.stringify(this.getData(), null, 2);
  }

  /**
   * Import data from JSON
   */
  import(json: string): void {
    const data: HeatmapData = JSON.parse(json);
    this.dataPoints = data.dataPoints;
  }

  /**
   * Clear data
   */
  clear(): void {
    this.dataPoints = [];
    this.clearCanvas();
  }

  /**
   * Add data point
   */
  protected addDataPoint(point: HeatmapDataPoint): void {
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.dataPoints.push({
      ...point,
      timestamp: point.timestamp || Date.now()
    });

    // Limit data points
    if (this.dataPoints.length > this.config.maxDataPoints) {
      this.dataPoints.shift();
    }
  }

  /**
   * Create canvas overlay
   */
  protected createCanvas(): void {
    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "9998";
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.ctx = this.canvas.getContext("2d");
    this.config.container!.appendChild(this.canvas);

    // Update canvas size on resize
    window.addEventListener("resize", () => {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.render();
      }
    });
  }

  /**
   * Clear canvas
   */
  protected clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw heatmap
   */
  protected drawHeatmap(points: HeatmapDataPoint[]): void {
    if (!this.ctx || !this.canvas) return;

    const radius = 30;
    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);

    // Color scheme
    const colors = this.getColorScheme();

    gradient.addColorStop(0, colors.hot);
    gradient.addColorStop(0.5, colors.warm);
    gradient.addColorStop(1, colors.cool);

    // Draw each point
    points.forEach((point) => {
      if (!this.ctx) return;

      this.ctx.save();
      this.ctx.translate(point.x, point.y);
      this.ctx.globalAlpha = this.config.opacity * (point.weight || 1);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
      this.ctx.restore();
    });
  }

  /**
   * Get color scheme
   */
  protected getColorScheme(): { hot: string; warm: string; cool: string } {
    const schemes = {
      hot: {
        hot: "rgba(255, 0, 0, 1)",
        warm: "rgba(255, 165, 0, 0.6)",
        cool: "rgba(255, 255, 0, 0.2)"
      },
      cool: {
        hot: "rgba(0, 0, 255, 1)",
        warm: "rgba(0, 165, 255, 0.6)",
        cool: "rgba(0, 255, 255, 0.2)"
      },
      rainbow: {
        hot: "rgba(255, 0, 255, 1)",
        warm: "rgba(128, 0, 255, 0.6)",
        cool: "rgba(0, 128, 255, 0.2)"
      }
    };

    return schemes[this.config.colorScheme];
  }

  /**
   * Get element path
   */
  protected getElementPath(element: Element | null): string {
    if (!element) return "";

    const path: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).join(".");
        if (classes) {
          selector += `.${classes}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }
}

/**
 * Click Heatmap
 */
export class ClickHeatmap extends BaseHeatmap {
  constructor(config: Omit<HeatmapConfig, "type"> = {}) {
    super({ ...config, type: "click" });
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    document.addEventListener("click", this.handleClick);
  }

  stopTracking(): void {
    super.stopTracking();
    document.removeEventListener("click", this.handleClick);
  }

  private handleClick = (e: MouseEvent): void => {
    if (!this.isTracking) return;

    this.addDataPoint({
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
      weight: 1,
      element: this.getElementPath(e.target as Element)
    });
  };
}

/**
 * Scroll Heatmap
 */
export class ScrollHeatmap extends BaseHeatmap {
  private scrollDepths: Map<number, number> = new Map();

  constructor(config: Omit<HeatmapConfig, "type"> = {}) {
    super({ ...config, type: "scroll" });
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    window.addEventListener("scroll", this.handleScroll);
  }

  stopTracking(): void {
    super.stopTracking();
    window.removeEventListener("scroll", this.handleScroll);
  }

  private handleScroll = (): void => {
    if (!this.isTracking) return;

    const scrollY = window.scrollY;
    const bucket = Math.floor(scrollY / 100) * 100;

    const currentCount = this.scrollDepths.get(bucket) || 0;
    this.scrollDepths.set(bucket, currentCount + 1);

    // Add data point
    this.addDataPoint({
      x: window.innerWidth / 2,
      y: scrollY,
      weight: (currentCount + 1) / 100
    });
  };

  /**
   * Get scroll depth percentage
   */
  getScrollDepth(): number {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;

    return (currentScroll / maxScroll) * 100;
  }
}

/**
 * Attention Heatmap (mouse hover duration)
 */
export class AttentionHeatmap extends BaseHeatmap {
  private hoverStartTime: number | null = null;
  private currentPosition: { x: number; y: number } | null = null;

  constructor(config: Omit<HeatmapConfig, "type"> = {}) {
    super({ ...config, type: "attention" });
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseleave", this.handleMouseLeave);
  }

  stopTracking(): void {
    super.stopTracking();
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseleave", this.handleMouseLeave);
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isTracking) return;

    const now = Date.now();
    const newPosition = {
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY
    };

    // If mouse moved significantly, record attention
    if (this.currentPosition) {
      const distance = Math.sqrt(
        Math.pow(newPosition.x - this.currentPosition.x, 2) +
          Math.pow(newPosition.y - this.currentPosition.y, 2)
      );

      // If mouse didn't move much (< 50px) for some time, it's "attention"
      if (distance < 50 && this.hoverStartTime) {
        const duration = now - this.hoverStartTime;

        if (duration > 1000) {
          // 1 second threshold
          this.addDataPoint({
            x: this.currentPosition.x,
            y: this.currentPosition.y,
            weight: Math.min(duration / 10000, 1), // Max weight at 10 seconds
            element: this.getElementPath(e.target as Element)
          });

          this.hoverStartTime = now;
        }
      } else {
        this.hoverStartTime = now;
      }
    } else {
      this.hoverStartTime = now;
    }

    this.currentPosition = newPosition;
  };

  private handleMouseLeave = (): void => {
    this.hoverStartTime = null;
    this.currentPosition = null;
  };
}

/**
 * Rage Click Heatmap
 */
export class RageClickHeatmap extends BaseHeatmap {
  private clickHistory: Array<{ x: number; y: number; time: number }> = [];
  private readonly RAGE_THRESHOLD = 5; // clicks
  private readonly TIME_WINDOW = 5000; // 5 seconds

  constructor(config: Omit<HeatmapConfig, "type"> = {}) {
    super({ ...config, type: "rage" });
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    document.addEventListener("click", this.handleClick);
  }

  stopTracking(): void {
    super.stopTracking();
    document.removeEventListener("click", this.handleClick);
  }

  private handleClick = (e: MouseEvent): void => {
    if (!this.isTracking) return;

    const now = Date.now();
    const position = {
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY,
      time: now
    };

    // Add to history
    this.clickHistory.push(position);

    // Remove old clicks outside time window
    this.clickHistory = this.clickHistory.filter(
      (click) => now - click.time < this.TIME_WINDOW
    );

    // Check for rage clicks (5+ clicks in same area)
    const nearbyClicks = this.clickHistory.filter((click) => {
      const distance = Math.sqrt(
        Math.pow(click.x - position.x, 2) + Math.pow(click.y - position.y, 2)
      );
      return distance < 100; // Within 100px radius
    });

    if (nearbyClicks.length >= this.RAGE_THRESHOLD) {
      // Record rage click with high weight
      this.addDataPoint({
        x: position.x,
        y: position.y,
        weight: 2, // Double weight for rage clicks
        element: this.getElementPath(e.target as Element)
      });
    }
  };
}

/**
 * Dead Click Heatmap (clicks with no effect)
 */
export class DeadClickHeatmap extends BaseHeatmap {
  private lastClickTarget: Element | null = null;
  private lastClickPosition: { x: number; y: number } | null = null;
  private lastClickTime: number | null = null;

  constructor(config: Omit<HeatmapConfig, "type"> = {}) {
    super({ ...config, type: "dead" });
  }

  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;

    document.addEventListener("click", this.handleClick, true);
    document.addEventListener("DOMSubtreeModified", this.handleDOMChange);
  }

  stopTracking(): void {
    super.stopTracking();
    document.removeEventListener("click", this.handleClick, true);
    document.removeEventListener("DOMSubtreeModified", this.handleDOMChange);
  }

  private handleClick = (e: MouseEvent): void => {
    if (!this.isTracking) return;

    this.lastClickTarget = e.target as Element;
    this.lastClickPosition = {
      x: e.clientX + window.scrollX,
      y: e.clientY + window.scrollY
    };
    this.lastClickTime = Date.now();

    // Check after 500ms if anything changed
    setTimeout(() => this.checkDeadClick(), 500);
  };

  private handleDOMChange = (): void => {
    // Reset on DOM change (indicates click had effect)
    this.lastClickTarget = null;
    this.lastClickPosition = null;
    this.lastClickTime = null;
  };

  private checkDeadClick(): void {
    if (
      !this.lastClickTarget ||
      !this.lastClickPosition ||
      !this.lastClickTime
    ) {
      return;
    }

    // If we still have the click recorded, it's likely a dead click
    const target = this.lastClickTarget;

    // Check if element is clickable
    const tagName = target.tagName.toLowerCase();
    const isClickable =
      tagName === "a" ||
      tagName === "button" ||
      target.hasAttribute("onclick") ||
      target.getAttribute("role") === "button";

    // Check if element has cursor: pointer
    const style = window.getComputedStyle(target);
    const hasPointer = style.cursor === "pointer";

    // If it looks clickable but nothing happened, it's a dead click
    if (isClickable || hasPointer) {
      this.addDataPoint({
        x: this.lastClickPosition.x,
        y: this.lastClickPosition.y,
        weight: 1.5, // Higher weight for dead clicks
        element: this.getElementPath(target)
      });
    }

    // Reset
    this.lastClickTarget = null;
    this.lastClickPosition = null;
    this.lastClickTime = null;
  }
}

/**
 * Heatmap Manager
 */
export class HeatmapManager {
  private heatmaps: Map<string, BaseHeatmap> = new Map();

  /**
   * Create and register heatmap
   */
  create(type: HeatmapConfig["type"], config?: Omit<HeatmapConfig, "type">): BaseHeatmap {
    let heatmap: BaseHeatmap;

    switch (type) {
      case "click":
        heatmap = new ClickHeatmap(config);
        break;
      case "scroll":
        heatmap = new ScrollHeatmap(config);
        break;
      case "attention":
        heatmap = new AttentionHeatmap(config);
        break;
      case "rage":
        heatmap = new RageClickHeatmap(config);
        break;
      case "dead":
        heatmap = new DeadClickHeatmap(config);
        break;
      default:
        throw new Error(`Unknown heatmap type: ${type}`);
    }

    this.heatmaps.set(type, heatmap);
    return heatmap;
  }

  /**
   * Get heatmap by type
   */
  get(type: string): BaseHeatmap | undefined {
    return this.heatmaps.get(type);
  }

  /**
   * Start all heatmaps
   */
  startAll(): void {
    this.heatmaps.forEach((heatmap) => heatmap.startTracking());
  }

  /**
   * Stop all heatmaps
   */
  stopAll(): void {
    this.heatmaps.forEach((heatmap) => heatmap.stopTracking());
  }

  /**
   * Render all heatmaps
   */
  renderAll(): void {
    this.heatmaps.forEach((heatmap) => heatmap.render());
  }

  /**
   * Export all heatmap data
   */
  exportAll(): Record<string, HeatmapData> {
    const data: Record<string, HeatmapData> = {};

    this.heatmaps.forEach((heatmap, type) => {
      data[type] = heatmap.getData();
    });

    return data;
  }

  /**
   * Clear all heatmaps
   */
  clearAll(): void {
    this.heatmaps.forEach((heatmap) => heatmap.clear());
  }
}

// Factory functions
export function createClickHeatmap(config?: Omit<HeatmapConfig, "type">): ClickHeatmap {
  return new ClickHeatmap(config);
}

export function createScrollHeatmap(config?: Omit<HeatmapConfig, "type">): ScrollHeatmap {
  return new ScrollHeatmap(config);
}

export function createAttentionHeatmap(config?: Omit<HeatmapConfig, "type">): AttentionHeatmap {
  return new AttentionHeatmap(config);
}

export function createRageClickHeatmap(config?: Omit<HeatmapConfig, "type">): RageClickHeatmap {
  return new RageClickHeatmap(config);
}

export function createDeadClickHeatmap(config?: Omit<HeatmapConfig, "type">): DeadClickHeatmap {
  return new DeadClickHeatmap(config);
}

export function createHeatmapManager(): HeatmapManager {
  return new HeatmapManager();
}
