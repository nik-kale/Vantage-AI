/**
 * @vantage-ai/cohorts
 * Cohort analysis and retention tracking
 *
 * Group users based on shared characteristics and track behavior over time
 */

// =============================================================================
// Types
// =============================================================================

export interface CohortDefinition {
  id: string;
  name: string;
  description?: string;
  type: "acquisition" | "behavioral" | "demographic" | "rfm";
  criteria: CohortCriteria;
  createdAt: number;
}

export interface CohortCriteria {
  /** Acquisition cohorts: Date range when user joined */
  dateRange?: {
    start: Date;
    end: Date;
  };

  /** Behavioral cohorts: Actions user performed */
  actions?: Array<{
    event: string;
    count?: number;
    within?: number; // time window in ms
  }>;

  /** Demographic cohorts: User properties */
  properties?: Record<string, any>;

  /** RFM cohorts: Recency, Frequency, Monetary */
  rfm?: {
    recency?: { min: number; max: number }; // days since last activity
    frequency?: { min: number; max: number }; // number of events
    monetary?: { min: number; max: number }; // total value
  };

  /** Custom matcher function */
  matcher?: (user: UserProfile) => boolean;
}

export interface UserProfile {
  id: string;
  joinedAt: number;
  lastSeenAt: number;
  properties: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    properties?: Record<string, any>;
  }>;
  totalValue?: number;
}

export interface CohortMetrics {
  cohortId: string;
  cohortName: string;
  totalUsers: number;
  activeUsers: number;
  retentionByPeriod: RetentionPeriod[];
  avgLifetimeValue?: number;
  churnRate: number;
  calculatedAt: number;
}

export interface RetentionPeriod {
  period: number; // 0 = day 0, 1 = day 1, etc.
  periodLabel: string; // "Day 1", "Week 2", "Month 3"
  retainedUsers: number;
  retentionRate: number; // 0-100
  dropoffRate: number; // 0-100
}

export interface RFMSegment {
  recencyScore: number; // 1-5
  frequencyScore: number; // 1-5
  monetaryScore: number; // 1-5
  segment: string; // "Champions", "Loyal", "At Risk", etc.
  users: string[]; // user IDs
}

// =============================================================================
// Cohort Manager
// =============================================================================

export class CohortManager {
  private cohorts: Map<string, CohortDefinition> = new Map();
  private users: Map<string, UserProfile> = new Map();
  private cohortMembership: Map<string, Set<string>> = new Map(); // cohortId -> Set<userId>

  /**
   * Register a new cohort
   */
  registerCohort(cohort: CohortDefinition): void {
    this.cohorts.set(cohort.id, cohort);
    this.cohortMembership.set(cohort.id, new Set());

    // Re-evaluate all users for this cohort
    this.users.forEach(user => {
      if (this.matchesCohort(user, cohort)) {
        this.cohortMembership.get(cohort.id)!.add(user.id);
      }
    });
  }

  /**
   * Add or update a user profile
   */
  addUser(user: UserProfile): void {
    this.users.set(user.id, user);

    // Evaluate user against all cohorts
    this.cohorts.forEach(cohort => {
      const members = this.cohortMembership.get(cohort.id)!;
      const matches = this.matchesCohort(user, cohort);

      if (matches) {
        members.add(user.id);
      } else {
        members.delete(user.id);
      }
    });
  }

  /**
   * Track event for a user
   */
  trackEvent(
    userId: string,
    eventName: string,
    properties?: Record<string, any>
  ): void {
    const user = this.users.get(userId);
    if (!user) {
      console.warn(`User ${userId} not found. Call addUser first.`);
      return;
    }

    user.events.push({
      name: eventName,
      timestamp: Date.now(),
      properties
    });

    user.lastSeenAt = Date.now();

    // Re-evaluate user against behavioral cohorts
    this.cohorts.forEach(cohort => {
      if (cohort.type === "behavioral") {
        const members = this.cohortMembership.get(cohort.id)!;
        const matches = this.matchesCohort(user, cohort);

        if (matches) {
          members.add(user.id);
        } else {
          members.delete(user.id);
        }
      }
    });
  }

  /**
   * Get cohort metrics including retention
   */
  getCohortMetrics(
    cohortId: string,
    options: {
      retentionPeriodType?: "daily" | "weekly" | "monthly";
      periods?: number; // number of periods to calculate
    } = {}
  ): CohortMetrics | null {
    const cohort = this.cohorts.get(cohortId);
    if (!cohort) return null;

    const members = this.cohortMembership.get(cohortId)!;
    const userIds = Array.from(members);
    const users = userIds.map(id => this.users.get(id)!).filter(Boolean);

    const totalUsers = users.length;
    const now = Date.now();
    const activeThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    const activeUsers = users.filter(u => now - u.lastSeenAt < activeThreshold).length;

    // Calculate retention by period
    const periodType = options.retentionPeriodType || "daily";
    const periods = options.periods || 30;
    const retentionByPeriod = this.calculateRetention(users, periodType, periods);

    // Calculate churn rate
    const churnRate = totalUsers > 0 ? ((totalUsers - activeUsers) / totalUsers) * 100 : 0;

    // Calculate average lifetime value
    const avgLifetimeValue = totalUsers > 0
      ? users.reduce((sum, u) => sum + (u.totalValue || 0), 0) / totalUsers
      : 0;

    return {
      cohortId,
      cohortName: cohort.name,
      totalUsers,
      activeUsers,
      retentionByPeriod,
      avgLifetimeValue,
      churnRate,
      calculatedAt: Date.now()
    };
  }

  /**
   * Get users in a cohort
   */
  getCohortUsers(cohortId: string): UserProfile[] {
    const members = this.cohortMembership.get(cohortId);
    if (!members) return [];

    return Array.from(members)
      .map(id => this.users.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get all cohorts a user belongs to
   */
  getUserCohorts(userId: string): CohortDefinition[] {
    const result: CohortDefinition[] = [];

    this.cohortMembership.forEach((members, cohortId) => {
      if (members.has(userId)) {
        const cohort = this.cohorts.get(cohortId);
        if (cohort) result.push(cohort);
      }
    });

    return result;
  }

  /**
   * RFM Analysis: Segment users by Recency, Frequency, Monetary value
   */
  getRFMSegments(): RFMSegment[] {
    const users = Array.from(this.users.values());
    const now = Date.now();

    // Calculate RFM scores for each user
    const userScores = users.map(user => {
      const recency = Math.floor((now - user.lastSeenAt) / (24 * 60 * 60 * 1000)); // days
      const frequency = user.events.length;
      const monetary = user.totalValue || 0;

      return {
        userId: user.id,
        recency,
        frequency,
        monetary
      };
    });

    // Calculate quintiles for scoring
    const recencyQuintiles = this.calculateQuintiles(userScores.map(u => u.recency));
    const frequencyQuintiles = this.calculateQuintiles(userScores.map(u => u.frequency));
    const monetaryQuintiles = this.calculateQuintiles(userScores.map(u => u.monetary));

    // Score users (1-5, where 5 is best)
    const scoredUsers = userScores.map(user => ({
      userId: user.userId,
      recencyScore: 6 - this.getQuintile(user.recency, recencyQuintiles), // Invert: lower recency is better
      frequencyScore: this.getQuintile(user.frequency, frequencyQuintiles),
      monetaryScore: this.getQuintile(user.monetary, monetaryQuintiles)
    }));

    // Group into segments
    const segments: Map<string, RFMSegment> = new Map();

    scoredUsers.forEach(user => {
      const segment = this.getRFMSegmentName(
        user.recencyScore,
        user.frequencyScore,
        user.monetaryScore
      );

      if (!segments.has(segment)) {
        segments.set(segment, {
          recencyScore: user.recencyScore,
          frequencyScore: user.frequencyScore,
          monetaryScore: user.monetaryScore,
          segment,
          users: []
        });
      }

      segments.get(segment)!.users.push(user.userId);
    });

    return Array.from(segments.values());
  }

  /**
   * Compare two cohorts
   */
  compareCohorts(cohortId1: string, cohortId2: string): {
    cohort1: CohortMetrics;
    cohort2: CohortMetrics;
    differences: {
      totalUsers: number;
      activeUsers: number;
      churnRate: number;
      avgLifetimeValue: number;
    };
  } | null {
    const metrics1 = this.getCohortMetrics(cohortId1);
    const metrics2 = this.getCohortMetrics(cohortId2);

    if (!metrics1 || !metrics2) return null;

    return {
      cohort1: metrics1,
      cohort2: metrics2,
      differences: {
        totalUsers: metrics1.totalUsers - metrics2.totalUsers,
        activeUsers: metrics1.activeUsers - metrics2.activeUsers,
        churnRate: metrics1.churnRate - metrics2.churnRate,
        avgLifetimeValue: (metrics1.avgLifetimeValue || 0) - (metrics2.avgLifetimeValue || 0)
      }
    };
  }

  private matchesCohort(user: UserProfile, cohort: CohortDefinition): boolean {
    const { criteria } = cohort;

    // Custom matcher takes precedence
    if (criteria.matcher) {
      return criteria.matcher(user);
    }

    // Acquisition cohort (date range)
    if (criteria.dateRange) {
      const { start, end } = criteria.dateRange;
      if (user.joinedAt < start.getTime() || user.joinedAt > end.getTime()) {
        return false;
      }
    }

    // Behavioral cohort (actions)
    if (criteria.actions) {
      for (const action of criteria.actions) {
        const events = user.events.filter(e => e.name === action.event);

        if (action.count && events.length < action.count) {
          return false;
        }

        if (action.within) {
          const now = Date.now();
          const recentEvents = events.filter(e => now - e.timestamp < action.within!);
          if (action.count && recentEvents.length < action.count) {
            return false;
          }
        }
      }
    }

    // Demographic cohort (properties)
    if (criteria.properties) {
      for (const [key, value] of Object.entries(criteria.properties)) {
        if (user.properties[key] !== value) {
          return false;
        }
      }
    }

    // RFM cohort
    if (criteria.rfm) {
      const now = Date.now();
      const recency = Math.floor((now - user.lastSeenAt) / (24 * 60 * 60 * 1000));
      const frequency = user.events.length;
      const monetary = user.totalValue || 0;

      if (criteria.rfm.recency) {
        const { min, max } = criteria.rfm.recency;
        if (recency < min || recency > max) return false;
      }

      if (criteria.rfm.frequency) {
        const { min, max } = criteria.rfm.frequency;
        if (frequency < min || frequency > max) return false;
      }

      if (criteria.rfm.monetary) {
        const { min, max } = criteria.rfm.monetary;
        if (monetary < min || monetary > max) return false;
      }
    }

    return true;
  }

  private calculateRetention(
    users: UserProfile[],
    periodType: "daily" | "weekly" | "monthly",
    periods: number
  ): RetentionPeriod[] {
    if (users.length === 0) return [];

    const periodMs = this.getPeriodMs(periodType);
    const result: RetentionPeriod[] = [];

    // Find earliest join date as cohort start
    const cohortStart = Math.min(...users.map(u => u.joinedAt));

    for (let period = 0; period < periods; period++) {
      const periodStart = cohortStart + period * periodMs;
      const periodEnd = periodStart + periodMs;

      // Count users who were active in this period
      const retainedUsers = users.filter(user => {
        // User must have joined before period start
        if (user.joinedAt > periodStart) return false;

        // Check if user had any activity in this period
        return user.events.some(e => e.timestamp >= periodStart && e.timestamp < periodEnd);
      }).length;

      const retentionRate = users.length > 0 ? (retainedUsers / users.length) * 100 : 0;

      result.push({
        period,
        periodLabel: this.getPeriodLabel(period, periodType),
        retainedUsers,
        retentionRate,
        dropoffRate: 100 - retentionRate
      });
    }

    return result;
  }

  private getPeriodMs(periodType: "daily" | "weekly" | "monthly"): number {
    switch (periodType) {
      case "daily":
        return 24 * 60 * 60 * 1000;
      case "weekly":
        return 7 * 24 * 60 * 60 * 1000;
      case "monthly":
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private getPeriodLabel(period: number, periodType: "daily" | "weekly" | "monthly"): string {
    switch (periodType) {
      case "daily":
        return `Day ${period}`;
      case "weekly":
        return `Week ${period}`;
      case "monthly":
        return `Month ${period}`;
    }
  }

  private calculateQuintiles(values: number[]): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const quintiles: number[] = [];

    for (let i = 1; i <= 4; i++) {
      const index = Math.floor((sorted.length * i) / 5);
      quintiles.push(sorted[index]);
    }

    return quintiles;
  }

  private getQuintile(value: number, quintiles: number[]): number {
    for (let i = 0; i < quintiles.length; i++) {
      if (value <= quintiles[i]) return i + 1;
    }
    return 5;
  }

  private getRFMSegmentName(r: number, f: number, m: number): string {
    // Champions: High R, F, M
    if (r >= 4 && f >= 4 && m >= 4) return "Champions";

    // Loyal Customers: High F
    if (f >= 4) return "Loyal Customers";

    // Potential Loyalists: Recent, moderate F
    if (r >= 4 && f >= 2) return "Potential Loyalists";

    // New Customers: High R, low F
    if (r >= 4 && f <= 2) return "New Customers";

    // Promising: Recent, low F, M
    if (r >= 3 && f <= 2 && m <= 2) return "Promising";

    // Needs Attention: Moderate R, F, M
    if (r >= 2 && r <= 3 && f >= 2 && f <= 3) return "Needs Attention";

    // About to Sleep: Low R, moderate F
    if (r <= 2 && f >= 2 && f <= 3) return "About to Sleep";

    // At Risk: Low R, high F, M
    if (r <= 2 && f >= 4) return "At Risk";

    // Can't Lose Them: Low R, high F, high M
    if (r <= 1 && f >= 4 && m >= 4) return "Can't Lose Them";

    // Hibernating: Low R, low F
    if (r <= 2 && f <= 2) return "Hibernating";

    // Lost: Very low R
    if (r === 1) return "Lost";

    return "Other";
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create an acquisition cohort (users who joined in a date range)
 */
export function createAcquisitionCohort(
  id: string,
  name: string,
  startDate: Date,
  endDate: Date
): CohortDefinition {
  return {
    id,
    name,
    type: "acquisition",
    criteria: {
      dateRange: { start: startDate, end: endDate }
    },
    createdAt: Date.now()
  };
}

/**
 * Create a behavioral cohort (users who performed specific actions)
 */
export function createBehavioralCohort(
  id: string,
  name: string,
  actions: Array<{ event: string; count?: number; within?: number }>
): CohortDefinition {
  return {
    id,
    name,
    type: "behavioral",
    criteria: { actions },
    createdAt: Date.now()
  };
}

/**
 * Create a demographic cohort (users with specific properties)
 */
export function createDemographicCohort(
  id: string,
  name: string,
  properties: Record<string, any>
): CohortDefinition {
  return {
    id,
    name,
    type: "demographic",
    criteria: { properties },
    createdAt: Date.now()
  };
}

/**
 * Export cohort data to CSV format
 */
export function exportCohortMetricsToCSV(metrics: CohortMetrics): string {
  const lines: string[] = [];

  // Header
  lines.push("Period,Period Label,Retained Users,Retention Rate,Dropoff Rate");

  // Data
  metrics.retentionByPeriod.forEach(period => {
    lines.push(
      `${period.period},${period.periodLabel},${period.retainedUsers},${period.retentionRate.toFixed(2)},${period.dropoffRate.toFixed(2)}`
    );
  });

  return lines.join("\n");
}

// =============================================================================
// Exports
// =============================================================================

export {
  CohortManager,
  createAcquisitionCohort,
  createBehavioralCohort,
  createDemographicCohort,
  exportCohortMetricsToCSV
};
