import type { EventContext, SuspicionSignal } from "../types";

interface FormSubmitAttempt {
  timestamp: number;
  hadErrors: boolean;
  formId: string;
}

const DEFAULT_WINDOW_MS = 30000; // 30 seconds
const DEFAULT_THRESHOLD = 3; // 3 failed attempts

export class FormFailureDetector {
  private attempts: Map<string, FormSubmitAttempt[]> = new Map();

  recordSubmit(ctx: EventContext): SuspicionSignal | null {
    const formId = (ctx.details.formId as string) || "unknown";
    const hadErrors = (ctx.details.hasErrors as boolean) || false;
    const now = ctx.timestamp;

    // Get existing attempts for this form
    let formAttempts = this.attempts.get(formId) || [];

    // Add current attempt
    formAttempts.push({
      timestamp: now,
      hadErrors,
      formId
    });

    // Filter to recent attempts within window
    formAttempts = formAttempts.filter(
      (attempt) => now - attempt.timestamp <= DEFAULT_WINDOW_MS
    );

    this.attempts.set(formId, formAttempts);

    // Count failed attempts
    const failedAttempts = formAttempts.filter((a) => a.hadErrors);

    if (failedAttempts.length >= DEFAULT_THRESHOLD) {
      const signal: SuspicionSignal = {
        id: `form-failure-${formId}-${now}`,
        score: Math.min(1, failedAttempts.length / (DEFAULT_THRESHOLD * 2)),
        category: "error",
        context: failedAttempts.map((attempt) => ({
          route: ctx.route,
          timestamp: attempt.timestamp,
          eventType: "form-submit-error",
          details: { formId: attempt.formId }
        }))
      };

      // Clear attempts after triggering
      this.attempts.set(formId, []);
      return signal;
    }

    return null;
  }

  clear(formId?: string): void {
    if (formId) {
      this.attempts.delete(formId);
    } else {
      this.attempts.clear();
    }
  }
}
