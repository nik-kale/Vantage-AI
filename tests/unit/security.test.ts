import { describe, it, expect } from "vitest";
import {
  sanitizeHTML,
  sanitizeURL,
  filterPII,
  isSafeRegex,
  RateLimiter
} from "../../packages/vantage-sdk/src/security/sanitizer";

describe("Security Utilities", () => {
  describe("sanitizeHTML", () => {
    it("should escape HTML tags", () => {
      const input = "<script>alert('xss')</script>";
      const output = sanitizeHTML(input);
      expect(output).not.toContain("<script>");
      expect(output).toContain("&lt;script&gt;");
    });

    it("should handle plain text", () => {
      const input = "Hello World";
      const output = sanitizeHTML(input);
      expect(output).toBe("Hello World");
    });
  });

  describe("sanitizeURL", () => {
    it("should allow HTTPS URLs", () => {
      const url = "https://example.com";
      expect(sanitizeURL(url)).toBe(url);
    });

    it("should block javascript: URLs", () => {
      const url = "javascript:alert('xss')";
      expect(sanitizeURL(url)).toBe("#");
    });

    it("should block data: URLs", () => {
      const url = "data:text/html,<script>alert('xss')</script>";
      expect(sanitizeURL(url)).toBe("#");
    });

    it("should allow relative URLs", () => {
      const url = "/path/to/page";
      expect(sanitizeURL(url)).toBe(url);
    });
  });

  describe("filterPII", () => {
    it("should filter email addresses", () => {
      const text = "Contact me at john@example.com";
      const filtered = filterPII(text);
      expect(filtered).toContain("[EMAIL]");
      expect(filtered).not.toContain("john@example.com");
    });

    it("should filter phone numbers", () => {
      const text = "Call me at 555-123-4567";
      const filtered = filterPII(text);
      expect(filtered).toContain("[PHONE]");
      expect(filtered).not.toContain("555-123-4567");
    });

    it("should filter SSNs", () => {
      const text = "My SSN is 123-45-6789";
      const filtered = filterPII(text);
      expect(filtered).toContain("[SSN]");
      expect(filtered).not.toContain("123-45-6789");
    });
  });

  describe("isSafeRegex", () => {
    it("should allow safe patterns", () => {
      expect(isSafeRegex("hello|world")).toBe(true);
      expect(isSafeRegex("\\d{3}-\\d{4}")).toBe(true);
    });

    it("should reject ReDoS patterns", () => {
      expect(isSafeRegex("(a+)+b")).toBe(false);
      expect(isSafeRegex("(\\w+)+$")).toBe(false);
    });
  });

  describe("RateLimiter", () => {
    it("should allow requests within limit", () => {
      const limiter = new RateLimiter(5, 1000);

      for (let i = 0; i < 5; i++) {
        expect(limiter.isAllowed("user1")).toBe(true);
      }
    });

    it("should block requests over limit", () => {
      const limiter = new RateLimiter(3, 1000);

      for (let i = 0; i < 3; i++) {
        limiter.isAllowed("user1");
      }

      expect(limiter.isAllowed("user1")).toBe(false);
    });

    it("should reset limits after window", (done) => {
      const limiter = new RateLimiter(2, 100);

      limiter.isAllowed("user1");
      limiter.isAllowed("user1");
      expect(limiter.isAllowed("user1")).toBe(false);

      setTimeout(() => {
        expect(limiter.isAllowed("user1")).toBe(true);
        done();
      }, 150);
    }, 200);
  });
});
