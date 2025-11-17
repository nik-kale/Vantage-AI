/**
 * @vantage-ai/ab-testing
 * Advanced A/B and multivariate testing with statistical significance
 */

export interface Experiment {
  id: string;
  name: string;
  type: "ab" | "multivariate";
  variants: Variant[];
  metric: string;
  status: "draft" | "running" | "completed";
  startDate?: number;
  endDate?: number;
  minSampleSize?: number;
  confidenceLevel?: number; // 0-1, default 0.95
}

export interface Variant {
  id: string;
  name: string;
  traffic: number; // 0-100
  conversions: number;
  impressions: number;
  value: number;
}

export interface StatisticalResult {
  winner: string | null;
  pValue: number;
  confidenceLevel: number;
  significant: boolean;
  sampleSizeReached: boolean;
  variants: Array<{
    id: string;
    conversionRate: number;
    improvement: number; // vs control
    confidenceInterval: [number, number];
  }>;
}

export class ExperimentEngine {
  calculateStatistics(experiment: Experiment): StatisticalResult {
    const control = experiment.variants[0];
    const variants = experiment.variants.map(v => ({
      id: v.id,
      conversionRate: v.impressions > 0 ? v.conversions / v.impressions : 0,
      improvement: 0,
      confidenceInterval: this.calculateConfidenceInterval(v)
    }));

    // Calculate improvements vs control
    const controlRate = variants[0].conversionRate;
    variants.forEach(v => {
      v.improvement = controlRate > 0 ? ((v.conversionRate - controlRate) / controlRate) * 100 : 0;
    });

    // Calculate p-value (simplified Z-test for proportions)
    const pValue = this.calculatePValue(control, experiment.variants[1]);
    const significant = pValue < (1 - (experiment.confidenceLevel || 0.95));
    const minSize = experiment.minSampleSize || 1000;
    const sampleSizeReached = experiment.variants.every(v => v.impressions >= minSize);

    return {
      winner: significant && sampleSizeReached ? this.findWinner(variants) : null,
      pValue,
      confidenceLevel: experiment.confidenceLevel || 0.95,
      significant,
      sampleSizeReached,
      variants
    };
  }

  private calculatePValue(control: Variant, variant: Variant): number {
    const p1 = control.conversions / control.impressions;
    const p2 = variant.conversions / variant.impressions;
    const pooled = (control.conversions + variant.conversions) / (control.impressions + variant.impressions);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / control.impressions + 1 / variant.impressions));
    const z = Math.abs((p2 - p1) / se);
    return 2 * (1 - this.normalCDF(z));
  }

  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  private erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }

  private calculateConfidenceInterval(variant: Variant): [number, number] {
    const rate = variant.conversions / variant.impressions;
    const se = Math.sqrt((rate * (1 - rate)) / variant.impressions);
    const z = 1.96; // 95% confidence
    return [rate - z * se, rate + z * se];
  }

  private findWinner(variants: Array<{ id: string; conversionRate: number }>): string | null {
    const best = variants.reduce((a, b) => a.conversionRate > b.conversionRate ? a : b);
    return best.id;
  }
}

export {
  Experiment,
  Variant,
  StatisticalResult,
  ExperimentEngine
};
