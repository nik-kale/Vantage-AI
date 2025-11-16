/**
 * A/B Testing Framework for Vantage AI
 */

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  sticky?: boolean; // Remember user's variant
}

export class ABTestingEngine {
  private assignments: Map<string, string> = new Map();
  private tests: Map<string, ABTest> = new Map();

  constructor(private storageKey: string = "vantage:ab-tests") {
    this.loadAssignments();
  }

  registerTest(test: ABTest): void {
    // Validate weights
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`AB test ${test.id}: weights must sum to 100`);
    }

    this.tests.set(test.id, test);
  }

  getVariant(testId: string, userId?: string): string | null {
    const test = this.tests.get(testId);
    if (!test) {
      console.warn(`AB test ${testId} not found`);
      return null;
    }

    // Check for existing assignment
    const cacheKey = userId ? `${testId}:${userId}` : testId;
    if (this.assignments.has(cacheKey)) {
      return this.assignments.get(cacheKey)!;
    }

    // Assign variant based on weighted distribution
    const variant = this.assignVariant(test);

    if (test.sticky) {
      this.assignments.set(cacheKey, variant);
      this.saveAssignments();
    }

    return variant;
  }

  private assignVariant(test: ABTest): string {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    // Fallback to last variant
    return test.variants[test.variants.length - 1].id;
  }

  private loadAssignments(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.assignments = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error("Failed to load AB test assignments", error);
    }
  }

  private saveAssignments(): void {
    try {
      const data = Object.fromEntries(this.assignments);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save AB test assignments", error);
    }
  }

  clearAssignments(): void {
    this.assignments.clear();
    localStorage.removeItem(this.storageKey);
  }
}
