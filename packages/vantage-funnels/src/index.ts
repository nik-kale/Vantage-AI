/**
 * Funnel Analysis - Track user conversion through defined steps
 */

export interface FunnelStep {
  id: string;
  name: string;
  /** URL pattern (regex) or custom matcher */
  matcher: string | ((context: any) => boolean);
  /** Optional: required conditions */
  conditions?: Record<string, any>;
}

export interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  /** Conversion window (ms) */
  conversionWindow?: number;
}

export interface FunnelProgress {
  funnelId: string;
  userId?: string;
  sessionId: string;
  completedSteps: string[];
  currentStep: number;
  startTime: number;
  lastUpdateTime: number;
  converted: boolean;
}

export interface FunnelMetrics {
  funnelId: string;
  totalSessions: number;
  stepMetrics: Array<{
    stepId: string;
    stepName: string;
    entered: number;
    completed: number;
    dropOff: number;
    dropOffRate: number;
    conversionRate: number;
    avgTimeToComplete: number;
  }>;
  overallConversionRate: number;
  avgTimeToConvert: number;
}

export class FunnelAnalyzer {
  private funnels: Map<string, Funnel> = new Map();
  private sessions: Map<string, FunnelProgress> = new Map();
  private completedSessions: FunnelProgress[] = [];

  /**
   * Register a funnel
   */
  registerFunnel(funnel: Funnel): void {
    this.funnels.set(funnel.id, {
      ...funnel,
      conversionWindow: funnel.conversionWindow || 30 * 60 * 1000 // 30 minutes default
    });
  }

  /**
   * Track event in funnel
   */
  trackEvent(funnelId: string, context: any, userId?: string): void {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) {
      console.warn(`Funnel ${funnelId} not found`);
      return;
    }

    const sessionId = this.getSessionId(userId);
    let progress = this.sessions.get(sessionId);

    if (!progress) {
      progress = {
        funnelId,
        userId,
        sessionId,
        completedSteps: [],
        currentStep: 0,
        startTime: Date.now(),
        lastUpdateTime: Date.now(),
        converted: false
      };
      this.sessions.set(sessionId, progress);
    }

    // Check if session expired
    if (Date.now() - progress.lastUpdateTime > funnel.conversionWindow!) {
      this.endSession(sessionId, false);
      return;
    }

    // Find matching step
    const currentStep = funnel.steps[progress.currentStep];
    if (this.matchesStep(currentStep, context)) {
      progress.completedSteps.push(currentStep.id);
      progress.currentStep++;
      progress.lastUpdateTime = Date.now();

      // Check if funnel completed
      if (progress.currentStep >= funnel.steps.length) {
        progress.converted = true;
        this.endSession(sessionId, true);
      }
    }
  }

  /**
   * Get funnel metrics
   */
  getMetrics(funnelId: string): FunnelMetrics | null {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) return null;

    const funnelSessions = this.completedSessions.filter(
      (s) => s.funnelId === funnelId
    );

    if (funnelSessions.length === 0) {
      return {
        funnelId,
        totalSessions: 0,
        stepMetrics: [],
        overallConversionRate: 0,
        avgTimeToConvert: 0
      };
    }

    const stepMetrics = funnel.steps.map((step, index) => {
      const entered = funnelSessions.filter(
        (s) => s.completedSteps.length > index
      ).length;

      const completed = funnelSessions.filter(
        (s) => s.completedSteps.includes(step.id)
      ).length;

      const dropOff = entered - completed;
      const dropOffRate = entered > 0 ? (dropOff / entered) * 100 : 0;
      const conversionRate = entered > 0 ? (completed / entered) * 100 : 0;

      // Calculate avg time to complete this step
      const completedTimes = funnelSessions
        .filter((s) => s.completedSteps.includes(step.id))
        .map((s) => s.lastUpdateTime - s.startTime);

      const avgTimeToComplete =
        completedTimes.length > 0
          ? completedTimes.reduce((sum, t) => sum + t, 0) / completedTimes.length
          : 0;

      return {
        stepId: step.id,
        stepName: step.name,
        entered,
        completed,
        dropOff,
        dropOffRate,
        conversionRate,
        avgTimeToComplete
      };
    });

    const converted = funnelSessions.filter((s) => s.converted).length;
    const overallConversionRate = (converted / funnelSessions.length) * 100;

    const convertedTimes = funnelSessions
      .filter((s) => s.converted)
      .map((s) => s.lastUpdateTime - s.startTime);

    const avgTimeToConvert =
      convertedTimes.length > 0
        ? convertedTimes.reduce((sum, t) => sum + t, 0) / convertedTimes.length
        : 0;

    return {
      funnelId,
      totalSessions: funnelSessions.length,
      stepMetrics,
      overallConversionRate,
      avgTimeToConvert
    };
  }

  /**
   * Get funnel progress for user/session
   */
  getProgress(userId?: string): FunnelProgress | null {
    const sessionId = this.getSessionId(userId);
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Reset all data
   */
  reset(): void {
    this.sessions.clear();
    this.completedSessions = [];
  }

  /**
   * Match step against context
   */
  private matchesStep(step: FunnelStep, context: any): boolean {
    if (typeof step.matcher === "function") {
      return step.matcher(context);
    }

    // String matcher (URL pattern)
    if (typeof step.matcher === "string") {
      const pattern = new RegExp(step.matcher);
      const url = context.url || context.route || window.location.href;
      return pattern.test(url);
    }

    return false;
  }

  /**
   * End session
   */
  private endSession(sessionId: string, converted: boolean): void {
    const progress = this.sessions.get(sessionId);
    if (!progress) return;

    progress.converted = converted;
    this.completedSessions.push(progress);
    this.sessions.delete(sessionId);
  }

  /**
   * Get session ID
   */
  private getSessionId(userId?: string): string {
    if (userId) {
      return `funnel-${userId}`;
    }

    // Use existing session ID or create new
    const existingSessionId = sessionStorage.getItem("vantage-funnel-session");
    if (existingSessionId) {
      return existingSessionId;
    }

    const newSessionId = `funnel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("vantage-funnel-session", newSessionId);
    return newSessionId;
  }
}

/**
 * Funnel Visualizer
 */
export class FunnelVisualizer {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Render funnel metrics
   */
  render(metrics: FunnelMetrics): void {
    this.container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.fontFamily = "Arial, sans-serif";
    wrapper.style.padding = "20px";

    // Title
    const title = document.createElement("h2");
    title.textContent = `Funnel Analysis: ${metrics.funnelId}`;
    wrapper.appendChild(title);

    // Overall stats
    const stats = document.createElement("div");
    stats.style.marginBottom = "20px";
    stats.innerHTML = `
      <p><strong>Total Sessions:</strong> ${metrics.totalSessions}</p>
      <p><strong>Overall Conversion Rate:</strong> ${metrics.overallConversionRate.toFixed(2)}%</p>
      <p><strong>Avg Time to Convert:</strong> ${this.formatDuration(metrics.avgTimeToConvert)}</p>
    `;
    wrapper.appendChild(stats);

    // Funnel steps
    const steps = document.createElement("div");
    steps.style.display = "flex";
    steps.style.flexDirection = "column";
    steps.style.gap = "10px";

    metrics.stepMetrics.forEach((step, index) => {
      const stepEl = document.createElement("div");
      stepEl.style.display = "flex";
      stepEl.style.alignItems = "center";
      stepEl.style.gap = "10px";
      stepEl.style.padding = "15px";
      stepEl.style.background = "#f5f5f5";
      stepEl.style.borderRadius = "8px";

      // Step number
      const num = document.createElement("div");
      num.textContent = String(index + 1);
      num.style.width = "30px";
      num.style.height = "30px";
      num.style.borderRadius = "50%";
      num.style.background = "#4CAF50";
      num.style.color = "white";
      num.style.display = "flex";
      num.style.alignItems = "center";
      num.style.justifyContent = "center";
      num.style.fontWeight = "bold";

      // Step info
      const info = document.createElement("div");
      info.style.flex = "1";
      info.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">${step.stepName}</div>
        <div style="font-size: 12px; color: #666;">
          ${step.completed} completed (${step.conversionRate.toFixed(1)}%)
          • ${step.dropOff} dropped off (${step.dropOffRate.toFixed(1)}%)
          • Avg time: ${this.formatDuration(step.avgTimeToComplete)}
        </div>
      `;

      // Progress bar
      const progress = document.createElement("div");
      progress.style.width = "200px";
      progress.style.height = "20px";
      progress.style.background = "#ddd";
      progress.style.borderRadius = "10px";
      progress.style.overflow = "hidden";

      const progressFill = document.createElement("div");
      progressFill.style.width = `${step.conversionRate}%`;
      progressFill.style.height = "100%";
      progressFill.style.background = "#4CAF50";
      progressFill.style.transition = "width 0.3s";

      progress.appendChild(progressFill);

      stepEl.appendChild(num);
      stepEl.appendChild(info);
      stepEl.appendChild(progress);

      steps.appendChild(stepEl);

      // Add arrow between steps
      if (index < metrics.stepMetrics.length - 1) {
        const arrow = document.createElement("div");
        arrow.textContent = "↓";
        arrow.style.textAlign = "center";
        arrow.style.fontSize = "24px";
        arrow.style.color = "#999";
        steps.appendChild(arrow);
      }
    });

    wrapper.appendChild(steps);
    this.container.appendChild(wrapper);
  }

  /**
   * Format duration
   */
  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

export function createFunnelAnalyzer(): FunnelAnalyzer {
  return new FunnelAnalyzer();
}

export function createFunnelVisualizer(container: HTMLElement): FunnelVisualizer {
  return new FunnelVisualizer(container);
}
