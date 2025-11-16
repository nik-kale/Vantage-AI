/**
 * Security utilities for sanitizing user input and preventing XSS attacks
 */

/**
 * Basic HTML sanitization to prevent XSS
 * Removes script tags, event handlers, and dangerous attributes
 */
export function sanitizeHTML(html: string): string {
  // Create a temporary element to parse HTML
  const temp = document.createElement("div");
  temp.textContent = html; // Use textContent to escape HTML
  return temp.innerHTML;
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return "#";
    }
  }

  // Allow http, https, mailto, tel, and relative URLs
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("#")
  ) {
    return url;
  }

  // For relative URLs without prefix, allow them
  if (!trimmed.includes(":")) {
    return url;
  }

  return "#";
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, any>>(
  obj: T
): Partial<T> {
  const dangerous = ["__proto__", "constructor", "prototype"];
  const sanitized: Partial<T> = {};

  for (const key in obj) {
    if (!dangerous.includes(key)) {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

/**
 * Detect and filter PII from strings
 */
export function filterPII(text: string): string {
  // Email pattern
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]");

  // Phone pattern (various formats)
  text = text.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[PHONE]");

  // SSN pattern
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]");

  // Credit card pattern (basic)
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[CREDIT_CARD]");

  return text;
}

/**
 * Safe JSON parse that prevents prototype pollution
 */
export function safeJSONParse<T = any>(json: string): T | null {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      return sanitizeObjectKeys(parsed) as T;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Generate cryptographically secure random ID
 */
export function secureRandomId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Rate limiter for preventing abuse
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 100, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validTimestamps.length >= this.limit) {
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

/**
 * Validate regex pattern to prevent ReDoS attacks
 */
export function isSafeRegex(pattern: string): boolean {
  // Check for common ReDoS patterns
  const dangerous = [
    /(\w+\+)+/,  // Nested quantifiers
    /(\w+\*)+/,  // Nested quantifiers
    /(\w+)+\w+/, // Catastrophic backtracking
  ];

  for (const test of dangerous) {
    if (test.test(pattern)) {
      return false;
    }
  }

  // Try to execute with timeout
  try {
    const regex = new RegExp(pattern);
    const testString = "a".repeat(100);
    const start = Date.now();
    regex.test(testString);
    const elapsed = Date.now() - start;

    // If it takes more than 10ms on a simple string, it's suspicious
    if (elapsed > 10) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}
