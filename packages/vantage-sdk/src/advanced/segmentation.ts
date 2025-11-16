/**
 * User Segmentation Engine
 */

export interface UserSegment {
  id: string;
  name: string;
  conditions: SegmentCondition[];
  logic?: "AND" | "OR"; // Default: AND
}

export interface SegmentCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in";
  value: any;
}

export class SegmentationEngine {
  private segments: Map<string, UserSegment> = new Map();

  registerSegment(segment: UserSegment): void {
    this.segments.set(segment.id, segment);
  }

  isInSegment(segmentId: string, user: Record<string, any>): boolean {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      console.warn(`Segment ${segmentId} not found`);
      return false;
    }

    const logic = segment.logic || "AND";
    const results = segment.conditions.map((condition) =>
      this.evaluateCondition(condition, user)
    );

    return logic === "AND" ? results.every((r) => r) : results.some((r) => r);
  }

  getMatchingSegments(user: Record<string, any>): string[] {
    const matching: string[] = [];

    for (const [id, segment] of this.segments.entries()) {
      if (this.isInSegment(id, user)) {
        matching.push(id);
      }
    }

    return matching;
  }

  private evaluateCondition(condition: SegmentCondition, user: Record<string, any>): boolean {
    const userValue = this.getNestedValue(user, condition.field);

    switch (condition.operator) {
      case "equals":
        return userValue === condition.value;

      case "not_equals":
        return userValue !== condition.value;

      case "contains":
        return String(userValue).includes(String(condition.value));

      case "greater_than":
        return Number(userValue) > Number(condition.value);

      case "less_than":
        return Number(userValue) < Number(condition.value);

      case "in":
        return Array.isArray(condition.value) && condition.value.includes(userValue);

      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(userValue);

      default:
        console.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }
}
