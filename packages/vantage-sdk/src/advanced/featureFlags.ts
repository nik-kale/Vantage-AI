/**
 * Feature Flags System
 * Control feature rollout, A/B tests, and gradual releases
 */

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  /** Rollout percentage (0-100) */
  rollout?: number;
  /** User segments that get this feature */
  segments?: string[];
  /** User IDs that get this feature */
  userIds?: string[];
  /** Environment (production, staging, development) */
  environments?: string[];
  /** Start/end dates for time-limited features */
  startDate?: Date;
  endDate?: Date;
}

export interface FeatureFlagEvaluation {
  flagId: string;
  enabled: boolean;
  variant?: string;
  reason: "user_id" | "segment" | "rollout" | "default" | "expired" | "environment";
}

export class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  private overrides: Map<string, boolean> = new Map(); // Local overrides
  private currentEnvironment: string;

  constructor(environment: string = "production") {
    this.currentEnvironment = environment;
    this.loadOverrides();
  }

  /**
   * Register feature flag
   */
  register(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
  }

  /**
   * Register multiple flags
   */
  registerBatch(flags: FeatureFlag[]): void {
    flags.forEach((flag) => this.register(flag));
  }

  /**
   * Check if feature is enabled for user
   */
  isEnabled(
    flagId: string,
    context?: { userId?: string; segments?: string[] }
  ): boolean {
    const evaluation = this.evaluate(flagId, context);
    return evaluation.enabled;
  }

  /**
   * Evaluate feature flag
   */
  evaluate(
    flagId: string,
    context?: { userId?: string; segments?: string[] }
  ): FeatureFlagEvaluation {
    // Check for local override
    if (this.overrides.has(flagId)) {
      return {
        flagId,
        enabled: this.overrides.get(flagId)!,
        reason: "default"
      };
    }

    const flag = this.flags.get(flagId);

    if (!flag) {
      console.warn(`Feature flag ${flagId} not found`);
      return {
        flagId,
        enabled: false,
        reason: "default"
      };
    }

    // Check environment
    if (
      flag.environments &&
      !flag.environments.includes(this.currentEnvironment)
    ) {
      return {
        flagId,
        enabled: false,
        reason: "environment"
      };
    }

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return {
        flagId,
        enabled: false,
        reason: "expired"
      };
    }

    if (flag.endDate && now > flag.endDate) {
      return {
        flagId,
        enabled: false,
        reason: "expired"
      };
    }

    // Check user ID whitelist
    if (context?.userId && flag.userIds?.includes(context.userId)) {
      return {
        flagId,
        enabled: true,
        reason: "user_id"
      };
    }

    // Check segments
    if (context?.segments && flag.segments) {
      const hasSegment = context.segments.some((segment) =>
        flag.segments!.includes(segment)
      );

      if (hasSegment) {
        return {
          flagId,
          enabled: flag.enabled,
          reason: "segment"
        };
      }
    }

    // Check rollout percentage
    if (flag.rollout !== undefined && context?.userId) {
      const hash = this.hashUserId(context.userId);
      const isInRollout = hash < flag.rollout;

      return {
        flagId,
        enabled: flag.enabled && isInRollout,
        reason: "rollout"
      };
    }

    // Default
    return {
      flagId,
      enabled: flag.enabled,
      reason: "default"
    };
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Override flag locally (for testing)
   */
  override(flagId: string, enabled: boolean): void {
    this.overrides.set(flagId, enabled);
    this.saveOverrides();
  }

  /**
   * Clear override
   */
  clearOverride(flagId: string): void {
    this.overrides.delete(flagId);
    this.saveOverrides();
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    this.overrides.clear();
    this.saveOverrides();
  }

  /**
   * Hash user ID to percentage (0-100)
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash % 100);
  }

  /**
   * Load overrides from localStorage
   */
  private loadOverrides(): void {
    try {
      const stored = localStorage.getItem("vantage-feature-flags");
      if (stored) {
        const data = JSON.parse(stored);
        this.overrides = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error("Failed to load feature flag overrides", error);
    }
  }

  /**
   * Save overrides to localStorage
   */
  private saveOverrides(): void {
    try {
      const data = Object.fromEntries(this.overrides);
      localStorage.setItem("vantage-feature-flags", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save feature flag overrides", error);
    }
  }
}

/**
 * React hook for feature flags
 */
export function useFeatureFlag(
  flagId: string,
  manager: FeatureFlagManager,
  context?: { userId?: string; segments?: string[] }
): boolean {
  return manager.isEnabled(flagId, context);
}

export function createFeatureFlagManager(environment?: string): FeatureFlagManager {
  return new FeatureFlagManager(environment);
}
