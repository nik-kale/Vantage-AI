/**
 * Performance Profiler for Vantage AI
 */

export interface PerformanceMetrics {
  detectorLatency: Map<string, number[]>;
  collectorOverhead: Map<string, number[]>;
  recommendationLatency: number[];
  widgetRenderTime: Map<string, number[]>;
  memoryUsage: number[];
}

export class VantageProfiler {
  private metrics: PerformanceMetrics = {
    detectorLatency: new Map(),
    collectorOverhead: new Map(),
    recommendationLatency: [],
    widgetRenderTime: new Map(),
    memoryUsage: []
  };

  private memoryInterval: ReturnType<typeof setInterval> | null = null;

  start(): void {
    this.metrics = {
      detectorLatency: new Map(),
      collectorOverhead: new Map(),
      recommendationLatency: [],
      widgetRenderTime: new Map(),
      memoryUsage: []
    };

    // Track memory usage
    if ("memory" in performance) {
      this.memoryInterval = setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage.push(memory.usedJSHeapSize / 1024 / 1024); // MB
      }, 1000);
    }
  }

  stop(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  recordDetectorLatency(detectorName: string, latency: number): void {
    if (!this.metrics.detectorLatency.has(detectorName)) {
      this.metrics.detectorLatency.set(detectorName, []);
    }
    this.metrics.detectorLatency.get(detectorName)!.push(latency);
  }

  recordCollectorOverhead(collectorName: string, overhead: number): void {
    if (!this.metrics.collectorOverhead.has(collectorName)) {
      this.metrics.collectorOverhead.set(collectorName, []);
    }
    this.metrics.collectorOverhead.get(collectorName)!.push(overhead);
  }

  recordRecommendationLatency(latency: number): void {
    this.metrics.recommendationLatency.push(latency);
  }

  recordWidgetRenderTime(widgetType: string, renderTime: number): void {
    if (!this.metrics.widgetRenderTime.has(widgetType)) {
      this.metrics.widgetRenderTime.set(widgetType, []);
    }
    this.metrics.widgetRenderTime.get(widgetType)!.push(renderTime);
  }

  getReport(): PerformanceReport {
    return {
      detectors: this.summarizeMap(this.metrics.detectorLatency),
      collectors: this.summarizeMap(this.metrics.collectorOverhead),
      recommendations: this.summarize(this.metrics.recommendationLatency),
      widgets: this.summarizeMap(this.metrics.widgetRenderTime),
      memory: {
        avg: this.average(this.metrics.memoryUsage),
        max: Math.max(...this.metrics.memoryUsage, 0),
        min: Math.min(...this.metrics.memoryUsage, 0)
      }
    };
  }

  private summarizeMap(map: Map<string, number[]>): Record<string, MetricSummary> {
    const result: Record<string, MetricSummary> = {};

    for (const [key, values] of map.entries()) {
      result[key] = this.summarize(values);
    }

    return result;
  }

  private summarize(values: number[]): MetricSummary {
    if (values.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0, max: 0, count: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);

    return {
      avg: this.average(values),
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      max: Math.max(...values),
      count: values.length
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

export interface MetricSummary {
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  count: number;
}

export interface PerformanceReport {
  detectors: Record<string, MetricSummary>;
  collectors: Record<string, MetricSummary>;
  recommendations: MetricSummary;
  widgets: Record<string, MetricSummary>;
  memory: {
    avg: number;
    max: number;
    min: number;
  };
}
