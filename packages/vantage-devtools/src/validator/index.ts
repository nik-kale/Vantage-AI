/**
 * Playbook Validator
 * Validates playbook syntax and logic
 */

import type { Playbook, PlaybookMatchCondition } from "@vantage-ai/sdk";
import { isSafeRegex } from "@vantage-ai/sdk/security/sanitizer";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export class PlaybookValidator {
  validate(playbook: Playbook): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validate ID
    if (!playbook.id || typeof playbook.id !== "string") {
      errors.push({
        field: "id",
        message: "Playbook ID is required and must be a string",
        severity: "error"
      });
    }

    // Validate match conditions
    if (!playbook.match) {
      errors.push({
        field: "match",
        message: "Match conditions are required",
        severity: "error"
      });
    } else {
      this.validateMatchCondition(playbook.match, errors, warnings);
    }

    // Validate recommendation
    if (!playbook.recommendation) {
      errors.push({
        field: "recommendation",
        message: "Recommendation is required",
        severity: "error"
      });
    } else {
      this.validateRecommendation(playbook.recommendation, errors, warnings);
    }

    // Validate version if present
    if (playbook.version && typeof playbook.version !== "string") {
      errors.push({
        field: "version",
        message: "Version must be a string",
        severity: "error"
      });
    }

    // Validate priority if present
    if (playbook.priority !== undefined) {
      if (typeof playbook.priority !== "number") {
        errors.push({
          field: "priority",
          message: "Priority must be a number",
          severity: "error"
        });
      } else if (playbook.priority < 0 || playbook.priority > 100) {
        warnings.push({
          field: "priority",
          message: "Priority should be between 0 and 100",
          severity: "warning"
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateMatchCondition(
    match: PlaybookMatchCondition,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // Check if at least one condition is specified
    const hasConditions =
      match.categories ||
      match.minScore !== undefined ||
      match.routePattern ||
      match.containsText;

    if (!hasConditions) {
      warnings.push({
        field: "match",
        message: "No match conditions specified - playbook will never match",
        severity: "warning"
      });
    }

    // Validate categories
    if (match.categories) {
      if (!Array.isArray(match.categories)) {
        errors.push({
          field: "match.categories",
          message: "Categories must be an array",
          severity: "error"
        });
      } else {
        const validCategories = ["friction", "error", "confusion"];
        const invalid = match.categories.filter((c) => !validCategories.includes(c));
        if (invalid.length > 0) {
          errors.push({
            field: "match.categories",
            message: `Invalid categories: ${invalid.join(", ")}`,
            severity: "error"
          });
        }
      }
    }

    // Validate minScore
    if (match.minScore !== undefined) {
      if (typeof match.minScore !== "number") {
        errors.push({
          field: "match.minScore",
          message: "minScore must be a number",
          severity: "error"
        });
      } else if (match.minScore < 0 || match.minScore > 1) {
        errors.push({
          field: "match.minScore",
          message: "minScore must be between 0 and 1",
          severity: "error"
        });
      }
    }

    // Validate routePattern
    if (match.routePattern) {
      if (typeof match.routePattern !== "string") {
        errors.push({
          field: "match.routePattern",
          message: "routePattern must be a string",
          severity: "error"
        });
      } else if (!isSafeRegex(match.routePattern)) {
        errors.push({
          field: "match.routePattern",
          message: "routePattern contains unsafe regex pattern (potential ReDoS)",
          severity: "error"
        });
      }
    }

    // Validate containsText
    if (match.containsText) {
      if (!Array.isArray(match.containsText)) {
        errors.push({
          field: "match.containsText",
          message: "containsText must be an array",
          severity: "error"
        });
      }
    }
  }

  private validateRecommendation(
    recommendation: any,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    if (!recommendation.id) {
      errors.push({
        field: "recommendation.id",
        message: "Recommendation ID is required",
        severity: "error"
      });
    }

    if (!recommendation.title) {
      errors.push({
        field: "recommendation.title",
        message: "Recommendation title is required",
        severity: "error"
      });
    }

    if (!recommendation.message) {
      errors.push({
        field: "recommendation.message",
        message: "Recommendation message is required",
        severity: "error"
      });
    }

    // Validate severity
    if (recommendation.severity) {
      const validSeverities = ["info", "warning", "critical"];
      if (!validSeverities.includes(recommendation.severity)) {
        errors.push({
          field: "recommendation.severity",
          message: `Invalid severity. Must be one of: ${validSeverities.join(", ")}`,
          severity: "error"
        });
      }
    }

    // Validate widget type
    if (recommendation.widget) {
      const validWidgets = ["banner", "tooltip", "checklist", "modal", "toast", "tour"];
      if (!validWidgets.includes(recommendation.widget)) {
        warnings.push({
          field: "recommendation.widget",
          message: `Unknown widget type: ${recommendation.widget}`,
          severity: "warning"
        });
      }
    }
  }

  validateBatch(playbooks: Playbook[]): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const playbook of playbooks) {
      results[playbook.id] = this.validate(playbook);
    }

    return results;
  }
}

export function validatePlaybook(playbook: Playbook): ValidationResult {
  const validator = new PlaybookValidator();
  return validator.validate(playbook);
}
