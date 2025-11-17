/**
 * @vantage-ai/ai-insights
 * AI-powered insights with anomaly detection and automated analysis
 *
 * Automatically detect patterns, anomalies, and generate actionable insights
 */

// =============================================================================
// Types
// =============================================================================

export interface TimeSeriesData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface Anomaly {
  timestamp: number;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: "low" | "medium" | "high" | "critical";
  type: "spike" | "drop" | "outlier" | "trend-change";
  description: string;
}

export interface Trend {
  direction: "up" | "down" | "stable";
  strength: number; // 0-1
  changePercent: number;
  confidence: number; // 0-1
  period: string;
}

export interface Insight {
  id: string;
  type: "anomaly" | "trend" | "pattern" | "forecast" | "recommendation";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  confidence: number; // 0-1
  data?: any;
  generatedAt: number;
  actionable?: boolean;
  suggestedAction?: string;
}

export interface ForecastPoint {
  timestamp: number;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

// =============================================================================
// Anomaly Detector
// =============================================================================

export class AnomalyDetector {
  private sensitivity: number; // 1-10, higher = more sensitive

  constructor(sensitivity: number = 5) {
    this.sensitivity = Math.max(1, Math.min(10, sensitivity));
  }

  /**
   * Detect anomalies using Z-score method
   */
  detectZScore(data: TimeSeriesData[], threshold?: number): Anomaly[] {
    if (data.length < 3) return [];

    const values = data.map(d => d.value);
    const mean = this.calculateMean(values);
    const stdDev = this.calculateStdDev(values, mean);

    // Adjust threshold based on sensitivity
    const zThreshold = threshold || (3 - (this.sensitivity / 10) * 1.5);

    const anomalies: Anomaly[] = [];

    data.forEach(point => {
      const zScore = Math.abs((point.value - mean) / stdDev);

      if (zScore > zThreshold) {
        const deviation = point.value - mean;
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: mean,
          deviation,
          severity: this.calculateSeverity(zScore, zThreshold),
          type: deviation > 0 ? "spike" : "drop",
          description: `Value ${point.value.toFixed(2)} is ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(2)}`
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect anomalies using IQR (Interquartile Range) method
   */
  detectIQR(data: TimeSeriesData[]): Anomaly[] {
    if (data.length < 4) return [];

    const values = data.map(d => d.value);
    const sorted = [...values].sort((a, b) => a - b);

    const q1 = this.percentile(sorted, 25);
    const q3 = this.percentile(sorted, 75);
    const iqr = q3 - q1;

    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const anomalies: Anomaly[] = [];

    data.forEach(point => {
      if (point.value < lowerBound || point.value > upperBound) {
        const median = this.percentile(sorted, 50);
        const deviation = point.value - median;

        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: median,
          deviation,
          severity: this.calculateSeverityIQR(point.value, lowerBound, upperBound, iqr),
          type: "outlier",
          description: `Value ${point.value.toFixed(2)} is outside IQR bounds [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}]`
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect trend changes
   */
  detectTrendChanges(data: TimeSeriesData[], windowSize: number = 7): Anomaly[] {
    if (data.length < windowSize * 2) return [];

    const anomalies: Anomaly[] = [];

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const prevWindow = data.slice(i - windowSize, i);
      const nextWindow = data.slice(i, i + windowSize);

      const prevTrend = this.calculateTrendSlope(prevWindow);
      const nextTrend = this.calculateTrendSlope(nextWindow);

      // Detect significant trend change
      if (Math.sign(prevTrend) !== Math.sign(nextTrend) && Math.abs(prevTrend - nextTrend) > 0.1) {
        anomalies.push({
          timestamp: data[i].timestamp,
          value: data[i].value,
          expectedValue: data[i].value,
          deviation: nextTrend - prevTrend,
          severity: "medium",
          type: "trend-change",
          description: `Trend changed from ${prevTrend > 0 ? "upward" : "downward"} to ${nextTrend > 0 ? "upward" : "downward"}`
        });
      }
    }

    return anomalies;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private calculateTrendSlope(data: TimeSeriesData[]): number {
    if (data.length < 2) return 0;

    const xMean = data.length / 2;
    const yMean = this.calculateMean(data.map(d => d.value));

    let numerator = 0;
    let denominator = 0;

    data.forEach((point, i) => {
      const xDiff = i - xMean;
      const yDiff = point.value - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    });

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateSeverity(zScore: number, threshold: number): Anomaly["severity"] {
    const ratio = zScore / threshold;
    if (ratio > 2) return "critical";
    if (ratio > 1.5) return "high";
    if (ratio > 1.2) return "medium";
    return "low";
  }

  private calculateSeverityIQR(value: number, lower: number, upper: number, iqr: number): Anomaly["severity"] {
    const distance = Math.min(Math.abs(value - lower), Math.abs(value - upper));
    const ratio = distance / iqr;
    if (ratio > 3) return "critical";
    if (ratio > 2) return "high";
    if (ratio > 1.5) return "medium";
    return "low";
  }
}

// =============================================================================
// Trend Analyzer
// =============================================================================

export class TrendAnalyzer {
  /**
   * Analyze trend in time series data
   */
  analyzeTrend(data: TimeSeriesData[], period: string = "current"): Trend {
    if (data.length < 2) {
      return {
        direction: "stable",
        strength: 0,
        changePercent: 0,
        confidence: 0,
        period
      };
    }

    const slope = this.calculateSlope(data);
    const rSquared = this.calculateRSquared(data);
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const changePercent = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

    let direction: Trend["direction"];
    if (Math.abs(changePercent) < 5) {
      direction = "stable";
    } else {
      direction = changePercent > 0 ? "up" : "down";
    }

    return {
      direction,
      strength: Math.min(1, Math.abs(slope) / 10),
      changePercent,
      confidence: rSquared,
      period
    };
  }

  /**
   * Compare two periods
   */
  comparePeriods(period1: TimeSeriesData[], period2: TimeSeriesData[]): {
    change: number;
    changePercent: number;
    significance: "significant" | "moderate" | "minimal";
  } {
    const mean1 = period1.reduce((sum, d) => sum + d.value, 0) / period1.length;
    const mean2 = period2.reduce((sum, d) => sum + d.value, 0) / period2.length;

    const change = mean2 - mean1;
    const changePercent = (change / Math.abs(mean1)) * 100;

    let significance: "significant" | "moderate" | "minimal";
    if (Math.abs(changePercent) > 20) {
      significance = "significant";
    } else if (Math.abs(changePercent) > 10) {
      significance = "moderate";
    } else {
      significance = "minimal";
    }

    return { change, changePercent, significance };
  }

  private calculateSlope(data: TimeSeriesData[]): number {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, d) => sum + d.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    data.forEach((point, i) => {
      const xDiff = i - xMean;
      const yDiff = point.value - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    });

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateRSquared(data: TimeSeriesData[]): number {
    const slope = this.calculateSlope(data);
    const yMean = data.reduce((sum, d) => sum + d.value, 0) / data.length;

    let ssTotal = 0;
    let ssResidual = 0;

    data.forEach((point, i) => {
      const yPredicted = slope * i + (yMean - slope * ((data.length - 1) / 2));
      ssTotal += Math.pow(point.value - yMean, 2);
      ssResidual += Math.pow(point.value - yPredicted, 2);
    });

    return ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0;
  }
}

// =============================================================================
// Forecast Engine
// =============================================================================

export class ForecastEngine {
  /**
   * Simple linear forecast
   */
  forecastLinear(data: TimeSeriesData[], steps: number): ForecastPoint[] {
    if (data.length < 2) return [];

    const slope = this.calculateSlope(data);
    const intercept = this.calculateIntercept(data, slope);
    const stdDev = this.calculateStdDev(data, slope, intercept);

    const lastTimestamp = data[data.length - 1].timestamp;
    const avgInterval = this.calculateAvgInterval(data);

    const forecast: ForecastPoint[] = [];

    for (let i = 1; i <= steps; i++) {
      const x = data.length + i - 1;
      const value = slope * x + intercept;
      const timestamp = lastTimestamp + avgInterval * i;
      const margin = 1.96 * stdDev; // 95% confidence interval

      forecast.push({
        timestamp,
        value,
        lowerBound: value - margin,
        upperBound: value + margin,
        confidence: 0.95
      });
    }

    return forecast;
  }

  /**
   * Moving average forecast
   */
  forecastMovingAverage(data: TimeSeriesData[], steps: number, windowSize: number = 7): ForecastPoint[] {
    if (data.length < windowSize) return [];

    const lastTimestamp = data[data.length - 1].timestamp;
    const avgInterval = this.calculateAvgInterval(data);

    // Calculate moving average for last window
    const lastWindow = data.slice(-windowSize);
    const avg = lastWindow.reduce((sum, d) => sum + d.value, 0) / windowSize;
    const stdDev = Math.sqrt(
      lastWindow.reduce((sum, d) => sum + Math.pow(d.value - avg, 2), 0) / windowSize
    );

    const forecast: ForecastPoint[] = [];

    for (let i = 1; i <= steps; i++) {
      const timestamp = lastTimestamp + avgInterval * i;
      const margin = 1.96 * stdDev;

      forecast.push({
        timestamp,
        value: avg,
        lowerBound: avg - margin,
        upperBound: avg + margin,
        confidence: 0.85
      });
    }

    return forecast;
  }

  private calculateSlope(data: TimeSeriesData[]): number {
    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, d) => sum + d.value, 0) / n;

    let numerator = 0;
    let denominator = 0;

    data.forEach((point, i) => {
      const xDiff = i - xMean;
      const yDiff = point.value - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    });

    return denominator !== 0 ? numerator / denominator : 0;
  }

  private calculateIntercept(data: TimeSeriesData[], slope: number): number {
    const yMean = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const xMean = (data.length - 1) / 2;
    return yMean - slope * xMean;
  }

  private calculateStdDev(data: TimeSeriesData[], slope: number, intercept: number): number {
    const residuals = data.map((point, i) => {
      const predicted = slope * i + intercept;
      return point.value - predicted;
    });

    const variance = residuals.reduce((sum, r) => sum + r * r, 0) / data.length;
    return Math.sqrt(variance);
  }

  private calculateAvgInterval(data: TimeSeriesData[]): number {
    if (data.length < 2) return 0;

    let totalInterval = 0;
    for (let i = 1; i < data.length; i++) {
      totalInterval += data[i].timestamp - data[i - 1].timestamp;
    }

    return totalInterval / (data.length - 1);
  }
}

// =============================================================================
// Insight Generator
// =============================================================================

export class InsightGenerator {
  private anomalyDetector: AnomalyDetector;
  private trendAnalyzer: TrendAnalyzer;
  private forecastEngine: ForecastEngine;

  constructor(sensitivity: number = 5) {
    this.anomalyDetector = new AnomalyDetector(sensitivity);
    this.trendAnalyzer = new TrendAnalyzer();
    this.forecastEngine = new ForecastEngine();
  }

  /**
   * Generate all insights for time series data
   */
  generateInsights(data: TimeSeriesData[]): Insight[] {
    const insights: Insight[] = [];

    // Anomaly insights
    const anomalies = this.anomalyDetector.detectZScore(data);
    anomalies.forEach(anomaly => {
      insights.push({
        id: `anomaly-${anomaly.timestamp}`,
        type: "anomaly",
        title: `${anomaly.type === "spike" ? "Spike" : "Drop"} Detected`,
        description: anomaly.description,
        severity: anomaly.severity === "critical" || anomaly.severity === "high" ? "critical" : "warning",
        confidence: 0.9,
        data: anomaly,
        generatedAt: Date.now(),
        actionable: true,
        suggestedAction: anomaly.type === "spike"
          ? "Investigate what caused this spike and whether it's sustainable"
          : "Investigate the cause of this drop and take corrective action"
      });
    });

    // Trend insights
    const trend = this.trendAnalyzer.analyzeTrend(data);
    if (trend.direction !== "stable" && Math.abs(trend.changePercent) > 10) {
      insights.push({
        id: `trend-${Date.now()}`,
        type: "trend",
        title: `${trend.direction === "up" ? "Upward" : "Downward"} Trend Detected`,
        description: `Metrics are trending ${trend.direction} by ${Math.abs(trend.changePercent).toFixed(1)}% with ${(trend.confidence * 100).toFixed(0)}% confidence`,
        severity: "info",
        confidence: trend.confidence,
        data: trend,
        generatedAt: Date.now(),
        actionable: trend.direction === "down",
        suggestedAction: trend.direction === "down"
          ? "Analyze the factors contributing to this decline and develop a recovery plan"
          : "Monitor this positive trend and identify factors for sustained growth"
      });
    }

    // Forecast insights
    if (data.length >= 7) {
      const forecast = this.forecastEngine.forecastLinear(data, 7);
      const forecastTrend = forecast[forecast.length - 1].value - forecast[0].value;

      insights.push({
        id: `forecast-${Date.now()}`,
        type: "forecast",
        title: "7-Day Forecast",
        description: `Based on current trends, expecting ${forecastTrend > 0 ? "growth" : "decline"} of ${Math.abs((forecastTrend / forecast[0].value) * 100).toFixed(1)}%`,
        severity: "info",
        confidence: 0.8,
        data: forecast,
        generatedAt: Date.now(),
        actionable: false
      });
    }

    return insights.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Generate natural language summary
   */
  generateSummary(data: TimeSeriesData[]): string {
    if (data.length === 0) return "No data available for analysis.";

    const insights = this.generateInsights(data);
    const trend = this.trendAnalyzer.analyzeTrend(data);
    const latest = data[data.length - 1].value;
    const previous = data[data.length - 2]?.value || latest;
    const change = ((latest - previous) / Math.abs(previous)) * 100;

    const parts: string[] = [];

    // Latest value
    parts.push(`Current value: ${latest.toFixed(2)}`);

    // Recent change
    if (Math.abs(change) > 1) {
      parts.push(`${change > 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)}% from previous period`);
    }

    // Trend
    if (trend.direction !== "stable") {
      parts.push(`Overall trend is ${trend.direction}ward (${trend.changePercent > 0 ? "+" : ""}${trend.changePercent.toFixed(1)}%)`);
    }

    // Anomalies
    const criticalInsights = insights.filter(i => i.severity === "critical");
    if (criticalInsights.length > 0) {
      parts.push(`⚠️ ${criticalInsights.length} critical anomal${criticalInsights.length === 1 ? "y" : "ies"} detected`);
    }

    return parts.join(". ") + ".";
  }
}

// =============================================================================
// Exports
// =============================================================================

export {
  AnomalyDetector,
  TrendAnalyzer,
  ForecastEngine,
  InsightGenerator
};
