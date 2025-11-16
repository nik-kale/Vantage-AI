import { describe, it, expect, beforeEach } from "vitest";
import { RageClickDetector } from "../../packages/vantage-sdk/src/detectors/rageClicks";
import { FormFailureDetector } from "../../packages/vantage-sdk/src/detectors/formFailures";
import type { EventContext } from "../../packages/vantage-sdk/src/types";

describe("Detectors", () => {
  describe("RageClickDetector", () => {
    let detector: RageClickDetector;

    beforeEach(() => {
      detector = new RageClickDetector();
    });

    it("should not trigger on few clicks", () => {
      const ctx: EventContext = {
        route: "/test",
        timestamp: Date.now(),
        eventType: "click",
        details: {}
      };

      for (let i = 0; i < 3; i++) {
        const signal = detector.recordClick(ctx);
        expect(signal).toBeNull();
      }
    });

    it("should trigger on many rapid clicks", () => {
      const baseTime = Date.now();

      for (let i = 0; i < 5; i++) {
        const ctx: EventContext = {
          route: "/test",
          timestamp: baseTime + i * 100,
          eventType: "click",
          details: {}
        };

        const signal = detector.recordClick(ctx);

        if (i === 4) {
          expect(signal).not.toBeNull();
          expect(signal?.category).toBe("friction");
        }
      }
    });
  });

  describe("FormFailureDetector", () => {
    let detector: FormFailureDetector;

    beforeEach(() => {
      detector = new FormFailureDetector();
    });

    it("should not trigger on single failure", () => {
      const ctx: EventContext = {
        route: "/checkout",
        timestamp: Date.now(),
        eventType: "form-submit",
        details: {
          formId: "payment-form",
          hasErrors: true
        }
      };

      const signal = detector.recordSubmit(ctx);
      expect(signal).toBeNull();
    });

    it("should trigger after multiple failures", () => {
      const baseTime = Date.now();

      for (let i = 0; i < 3; i++) {
        const ctx: EventContext = {
          route: "/checkout",
          timestamp: baseTime + i * 1000,
          eventType: "form-submit",
          details: {
            formId: "payment-form",
            hasErrors: true
          }
        };

        const signal = detector.recordSubmit(ctx);

        if (i === 2) {
          expect(signal).not.toBeNull();
          expect(signal?.category).toBe("error");
        }
      }
    });
  });
});
