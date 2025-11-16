import { describe, it, expect } from "vitest";
import {
  debounce,
  throttle,
  BoundedBuffer,
  Deduplicator
} from "../../packages/vantage-sdk/src/utils/performance";

describe("Performance Utilities", () => {
  describe("BoundedBuffer", () => {
    it("should maintain max size", () => {
      const buffer = new BoundedBuffer<number>(3);

      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);

      expect(buffer.size).toBe(3);
      const all = buffer.getAll();
      expect(all).toEqual([2, 3, 4]);
    });

    it("should clear buffer", () => {
      const buffer = new BoundedBuffer<number>(5);

      buffer.push(1);
      buffer.push(2);
      buffer.clear();

      expect(buffer.size).toBe(0);
    });
  });

  describe("Deduplicator", () => {
    it("should detect duplicates", () => {
      const dedup = new Deduplicator<{ id: string }>((item) => item.id, 1000);

      const item1 = { id: "test-1" };
      const item2 = { id: "test-1" };

      expect(dedup.isDuplicate(item1)).toBe(false);
      expect(dedup.isDuplicate(item2)).toBe(true);
    });

    it("should expire old entries", (done) => {
      const dedup = new Deduplicator<{ id: string }>((item) => item.id, 100);

      const item = { id: "test-1" };

      dedup.isDuplicate(item);

      setTimeout(() => {
        expect(dedup.isDuplicate(item)).toBe(false);
        done();
      }, 150);
    }, 200);
  });

  describe("debounce", () => {
    it("should debounce function calls", (done) => {
      let callCount = 0;
      const fn = debounce(() => {
        callCount++;
      }, 50);

      fn();
      fn();
      fn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    }, 150);
  });

  describe("throttle", () => {
    it("should throttle function calls", (done) => {
      let callCount = 0;
      const fn = throttle(() => {
        callCount++;
      }, 50);

      fn();
      fn();
      fn();

      expect(callCount).toBe(1);

      setTimeout(() => {
        fn();
        expect(callCount).toBe(2);
        done();
      }, 60);
    }, 100);
  });
});
