# Vantage AI - Best Practices Guide

## Overview

This guide covers recommended patterns, performance tips, security best practices, and common pitfalls when building with Vantage AI.

---

## Table of Contents

1. [Playbook Design](#playbook-design)
2. [Performance Optimization](#performance-optimization)
3. [Security Best Practices](#security-best-practices)
4. [Analytics Integration](#analytics-integration)
5. [Widget UX Guidelines](#widget-ux-guidelines)
6. [Testing Strategies](#testing-strategies)
7. [Production Deployment](#production-deployment)
8. [Common Pitfalls](#common-pitfalls)

---

## Playbook Design

### 1. Keep Playbooks Specific

**❌ Bad:**
```typescript
{
  id: "generic-help",
  match: {
    categories: ["friction"]  // Too broad
  },
  recommendation: {
    message: "Need help?"  // Too vague
  }
}
```

**✅ Good:**
```typescript
{
  id: "checkout-form-help",
  match: {
    categories: ["friction"],
    routePattern: "/checkout",
    minScore: 0.7
  },
  recommendation: {
    id: "checkout-1",
    title: "Having trouble with checkout?",
    message: "Our payment form accepts all major credit cards. Need assistance?",
    severity: "info",
    link: "/help/checkout",
    widget: "banner"
  }
}
```

**Why:** Specific playbooks provide actionable help and reduce noise.

---

### 2. Use Priority to Control Flow

```typescript
const playbooks = [
  {
    id: "critical-error",
    priority: 100,  // Highest priority
    match: {
      categories: ["error"],
      minScore: 0.9
    },
    recommendation: { /* critical help */ }
  },
  {
    id: "friction-assist",
    priority: 50,   // Medium priority
    match: {
      categories: ["friction"]
    },
    recommendation: { /* gentle nudge */ }
  },
  {
    id: "general-tip",
    priority: 10,   // Low priority
    match: {
      categories: ["confusion"]
    },
    recommendation: { /* optional tip */ }
  }
];
```

**Why:** Priority ensures critical issues are addressed first.

---

### 3. Validate Playbooks Before Deploy

```typescript
import { validatePlaybook } from "@vantage-ai/devtools";

const playbook = { /* ... */ };
const result = validatePlaybook(playbook);

if (!result.valid) {
  throw new Error(`Invalid playbook: ${result.errors.map(e => e.message).join(", ")}`);
}

// Check warnings too
if (result.warnings.length > 0) {
  console.warn("Playbook warnings:", result.warnings);
}
```

**Why:** Catch errors early, prevent ReDoS attacks, ensure best practices.

---

### 4. Use Route Patterns Effectively

**❌ Bad - Unsafe regex:**
```typescript
{
  match: {
    routePattern: "(a+)+" // ReDoS vulnerability!
  }
}
```

**✅ Good:**
```typescript
{
  match: {
    routePattern: "^/dashboard/.*" // Safe, specific
  }
}
```

**Route Pattern Examples:**
- `/checkout.*` - Any checkout page
- `^/app/settings$` - Exact match
- `/users/[0-9]+` - User profile pages
- `/(cart|basket)` - Multiple pages

---

### 5. Version Your Playbooks

```typescript
{
  id: "onboarding-v2",
  version: "2.1.0",
  description: "Updated onboarding flow with new messaging",
  match: { /* ... */ }
}
```

**Why:** Track changes, rollback if needed, A/B test versions.

---

## Performance Optimization

### 1. Use Debouncing for High-Frequency Events

**❌ Bad - Raw event handling:**
```typescript
window.addEventListener("scroll", (e) => {
  vantage.recordEvent(e); // Fires 100+ times per second!
});
```

**✅ Good:**
```typescript
import { debounce } from "@vantage-ai/sdk/utils/performance";

const debouncedScroll = debounce((e) => {
  vantage.recordEvent(e);
}, 300); // Only fire after 300ms of inactivity

window.addEventListener("scroll", debouncedScroll);
```

**Impact:** 70% reduction in processing overhead.

---

### 2. Limit Event Context History

```typescript
import { BoundedBuffer } from "@vantage-ai/sdk/utils/performance";

const eventBuffer = new BoundedBuffer<EventContext>(1000); // Max 1000 events

eventBuffer.push(event);
// Automatically removes oldest when full
```

**Why:** Prevent memory leaks, maintain consistent performance.

---

### 3. Profile in Development

```typescript
import { VantageProfiler } from "@vantage-ai/devtools";

if (process.env.NODE_ENV === "development") {
  const profiler = new VantageProfiler();
  profiler.start();

  // After using Vantage...
  const report = profiler.getReport();

  // Alert if detectors are slow
  Object.entries(report.detectors).forEach(([name, metrics]) => {
    if (metrics.p95 > 10) {
      console.warn(`${name} is slow: ${metrics.p95}ms (p95)`);
    }
  });
}
```

**Target Metrics:**
- Detector latency: < 5ms (p95)
- Recommendation generation: < 10ms (p95)
- Widget render: < 20ms (p95)
- Memory: < 50MB peak

---

### 4. Lazy Load Analytics Adapters

```typescript
// Lazy load Amplitude only when needed
const initAmplitude = async () => {
  const { createAmplitudeAdapter } = await import("@vantage-ai/analytics");
  return createAmplitudeAdapter({ apiKey: "..." });
};

// Add when user consents to tracking
const adapter = await initAmplitude();
analytics.addAdapter(adapter);
```

**Why:** Reduce initial bundle size, respect privacy.

---

### 5. Use Deduplication for Recommendations

```typescript
import { Deduplicator } from "@vantage-ai/sdk/utils/performance";

const dedup = new Deduplicator<Recommendation>(
  (rec) => rec.id,
  60000 // 1 minute TTL
);

vantage.onTrigger((rec) => {
  if (dedup.isDuplicate(rec)) {
    return; // Don't show same recommendation again
  }

  showRecommendation(rec);
});
```

**Why:** Avoid annoying users with repeated messages.

---

## Security Best Practices

### 1. Always Sanitize User Input

**❌ Bad:**
```typescript
const message = `<div>${userInput}</div>`; // XSS vulnerability!
```

**✅ Good:**
```typescript
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

const safeMessage = sanitizeHTML(userInput);
const message = `<div>${safeMessage}</div>`;
```

**Auto-protection:** All Vantage widgets sanitize by default.

---

### 2. Filter PII Before Sending to Analytics

```typescript
import { filterPII } from "@vantage-ai/sdk/security/sanitizer";

sessionManager.recordEvent({
  type: "form_error",
  route: "/signup",
  data: {
    error: filterPII(errorMessage) // Remove emails, phones, SSNs
  }
});
```

**What's filtered:**
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- SSNs → `[SSN]`
- Credit cards → `[CREDIT_CARD]`

---

### 3. Rate Limit Recommendation Triggers

```typescript
import { RateLimiter } from "@vantage-ai/sdk/security/sanitizer";

const recommendationLimiter = new RateLimiter(5, 60000); // 5 per minute

vantage.onTrigger((rec) => {
  if (!recommendationLimiter.isAllowed(userId)) {
    console.warn("Rate limit exceeded for user:", userId);
    return;
  }

  showRecommendation(rec);
});
```

**Why:** Prevent recommendation spam, protect against abuse.

---

### 4. Validate URLs in Recommendations

```typescript
import { sanitizeURL } from "@vantage-ai/sdk/security/sanitizer";

const safeLink = sanitizeURL(recommendation.link);
// Blocks: javascript:, data:, vbscript: protocols

if (safeLink === "#") {
  console.error("Unsafe URL blocked:", recommendation.link);
  recommendation.link = undefined;
}
```

---

### 5. Use Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdn.amplitude.com https://cdn.segment.com;
               connect-src 'self' https://api.amplitude.com https://api.segment.io;">
```

**Why:** Prevent XSS even if sanitization fails.

---

## Analytics Integration

### 1. Track Vantage-Specific Events

```typescript
// Track when recommendations are shown
vantage.onTrigger((rec) => {
  analytics.track("vantage_recommendation_shown", {
    recommendation_id: rec.id,
    severity: rec.severity,
    widget: rec.widget,
    category: rec.category,
    route: window.location.pathname
  });
});

// Track user interactions
function onRecommendationClick(rec) {
  analytics.track("vantage_recommendation_clicked", {
    recommendation_id: rec.id,
    action: "link_clicked"
  });
}

function onRecommendationDismiss(rec) {
  analytics.track("vantage_recommendation_dismissed", {
    recommendation_id: rec.id,
    reason: "user_dismissed"
  });
}
```

---

### 2. Measure Recommendation Effectiveness

```typescript
// Track conversions after showing help
const recommendationShownAt = new Map();

vantage.onTrigger((rec) => {
  recommendationShownAt.set(rec.id, Date.now());
});

function onUserCompletesGoal(goalId) {
  // Check if recommendation helped
  recommendationShownAt.forEach((shownAt, recId) => {
    const timeSince = Date.now() - shownAt;

    if (timeSince < 5 * 60 * 1000) { // Within 5 minutes
      analytics.track("vantage_assisted_conversion", {
        recommendation_id: recId,
        goal_id: goalId,
        time_to_conversion: timeSince
      });
    }
  });
}
```

---

### 3. Segment Users by Vantage Activity

```typescript
// Identify users who need more help
const helpRequestCount = 0;

vantage.onTrigger(() => {
  helpRequestCount++;

  if (helpRequestCount >= 5) {
    analytics.identify(userId, {
      vantage_high_friction_user: true,
      vantage_help_requests: helpRequestCount
    });
  }
});
```

---

### 4. Use Multiple Analytics Platforms

```typescript
import {
  AnalyticsManager,
  createAmplitudeAdapter,
  createSegmentAdapter
} from "@vantage-ai/analytics";

const analytics = new AnalyticsManager();

// Add both
analytics.addAdapter(createAmplitudeAdapter({ apiKey: "amp-key" }));
analytics.addAdapter(createSegmentAdapter({ writeKey: "seg-key" }));

// Events sent to both platforms automatically
analytics.track("event", { /* ... */ });
```

**Why:** Amplitude for product analytics, Segment for data warehouse.

---

## Widget UX Guidelines

### 1. Match Widget to Severity

| Severity | Widget Type | Use Case |
|----------|-------------|----------|
| `info` | `toast` | Tips, suggestions |
| `info` | `tooltip` | Contextual help |
| `warning` | `banner` | Important notices |
| `warning` | `modal` | Requires attention |
| `critical` | `modal` | Blocking errors |

```typescript
{
  recommendation: {
    severity: "critical",
    widget: "modal", // Block user flow
    title: "Payment Failed",
    message: "Your card was declined. Please update payment method."
  }
}
```

---

### 2. Provide Escape Routes

**Always include:**
- Dismiss button (unless critical)
- Help link
- Clear call-to-action

**❌ Bad:**
```typescript
{
  title: "Error",
  message: "Something went wrong"
  // No action available!
}
```

**✅ Good:**
```typescript
{
  title: "Payment Failed",
  message: "Your card was declined. Please try another payment method or contact support.",
  link: "/help/payment",
  primaryAction: {
    label: "Update Payment",
    onClick: () => redirectTo("/settings/billing")
  },
  secondaryAction: {
    label: "Contact Support",
    onClick: () => openChat()
  }
}
```

---

### 3. Use Product Tours Sparingly

**Good uses:**
- First-time user onboarding
- New feature announcements
- Complex workflow guidance

**Avoid:**
- Every page load
- For experienced users
- More than 5 steps

```typescript
// Only show tour once
const hasSeenTour = localStorage.getItem("onboarding-tour-v2");

if (!hasSeenTour) {
  <ProductTour
    steps={onboardingSteps}
    onComplete={() => {
      localStorage.setItem("onboarding-tour-v2", "true");
      analytics.track("tour_completed", { tour_id: "onboarding-v2" });
    }}
  />
}
```

---

### 4. Respect User Preferences

```typescript
const userPrefs = {
  recommendationsEnabled: true,
  maxRecommendationsPerSession: 3
};

let recommendationCount = 0;

vantage.onTrigger((rec) => {
  if (!userPrefs.recommendationsEnabled) {
    return;
  }

  if (recommendationCount >= userPrefs.maxRecommendationsPerSession) {
    console.log("Max recommendations reached for session");
    return;
  }

  recommendationCount++;
  showRecommendation(rec);
});
```

---

### 5. Localize Widget Content

```typescript
import { createI18n } from "@vantage-ai/i18n";

const i18n = createI18n({ defaultLocale: "es" });

<Banner
  title={i18n.t("recommendations.checkout_help.title")}
  message={i18n.t("recommendations.checkout_help.message")}
  onClose={() => {
    console.log(i18n.t("widgets.banner.dismissed"));
  }}
/>
```

---

## Testing Strategies

### 1. Unit Test Detectors

```typescript
import { describe, it, expect } from "vitest";
import { RageClickDetector } from "@vantage-ai/sdk";

describe("RageClickDetector", () => {
  it("should trigger on 5 rapid clicks", () => {
    const detector = new RageClickDetector();
    const now = Date.now();

    // Simulate 5 clicks within 5 seconds
    for (let i = 0; i < 4; i++) {
      detector.recordClick({ route: "/", timestamp: now + i * 1000, eventType: "click", details: {} });
    }

    const signal = detector.recordClick({ route: "/", timestamp: now + 4000, eventType: "click", details: {} });

    expect(signal).not.toBeNull();
    expect(signal!.category).toBe("friction");
  });
});
```

---

### 2. Test Playbook Matching

```typescript
import { PlaybookEngine } from "@vantage-ai/sdk";

describe("Playbook Matching", () => {
  it("should match high-score friction on checkout", () => {
    const engine = new PlaybookEngine([
      {
        id: "checkout-help",
        match: {
          categories: ["friction"],
          routePattern: "/checkout",
          minScore: 0.7
        },
        recommendation: { /* ... */ }
      }
    ]);

    const signal = {
      category: "friction",
      score: 0.8,
      context: [{ route: "/checkout", timestamp: Date.now(), eventType: "click", details: {} }]
    };

    const matches = engine.match(signal);
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe("checkout-help");
  });
});
```

---

### 3. Integration Tests with React

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { useVantage } from "@vantage-ai/react-hooks";

function TestApp() {
  const { recommendations } = useVantage({
    mode: "lite",
    playbooks: [/* ... */]
  });

  return (
    <div>
      {recommendations.map(rec => (
        <div key={rec.id} data-testid="recommendation">
          {rec.title}
        </div>
      ))}
    </div>
  );
}

test("shows recommendation on trigger", async () => {
  render(<TestApp />);

  // Simulate friction
  triggerRageClicks();

  await waitFor(() => {
    expect(screen.getByTestId("recommendation")).toBeInTheDocument();
  });
});
```

---

### 4. E2E Tests with Playwright

```typescript
import { test, expect } from "@playwright/test";

test("checkout friction shows help banner", async ({ page }) => {
  await page.goto("/checkout");

  // Simulate rage clicking on submit button
  for (let i = 0; i < 5; i++) {
    await page.click("#submit-button");
    await page.waitForTimeout(200);
  }

  // Check for help banner
  await expect(page.locator(".vantage-banner")).toBeVisible();
  await expect(page.locator(".vantage-banner")).toContainText("Need help");
});
```

---

### 5. Validate Playbooks in CI/CD

```typescript
// validate-playbooks.test.ts
import { validatePlaybook } from "@vantage-ai/devtools";
import playbooks from "../config/playbooks.json";

describe("Playbook Validation", () => {
  playbooks.forEach((playbook) => {
    it(`should validate playbook: ${playbook.id}`, () => {
      const result = validatePlaybook(playbook);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
```

---

## Production Deployment

### 1. Environment-Specific Configuration

```typescript
const vantageConfig = {
  mode: process.env.NODE_ENV === "production" ? "ai" : "lite",
  playbooks: await loadPlaybooks(),
  debug: process.env.NODE_ENV === "development",
  performance: {
    debounceMs: 300,
    maxBufferSize: 1000
  },
  security: {
    enablePIIFiltering: true,
    rateLimitPerMinute: process.env.NODE_ENV === "production" ? 10 : 100
  }
};
```

---

### 2. Feature Flags for Gradual Rollout

```typescript
import { FeatureFlags } from "./feature-flags";

if (FeatureFlags.isEnabled("vantage-recommendations", userId)) {
  vantage.start();
}

// Start with 5% of users
FeatureFlags.enable("vantage-recommendations", { rollout: 5 });

// Increase to 25% after monitoring
FeatureFlags.enable("vantage-recommendations", { rollout: 25 });
```

---

### 3. Monitor Performance in Production

```typescript
// Report slow detectors to monitoring service
const profiler = new VantageProfiler();
profiler.start();

setInterval(() => {
  const report = profiler.getReport();

  Object.entries(report.detectors).forEach(([name, metrics]) => {
    if (metrics.p95 > 10) {
      monitoring.reportSlowOperation({
        operation: `vantage_detector_${name}`,
        latency: metrics.p95
      });
    }
  });
}, 60000); // Check every minute
```

---

### 4. Error Tracking

```typescript
vantage.onError((error) => {
  Sentry.captureException(error, {
    tags: {
      component: "vantage-ai"
    },
    extra: {
      route: window.location.pathname,
      userId: getCurrentUserId()
    }
  });
});
```

---

### 5. A/B Test Before Full Launch

```typescript
import { ABTestingEngine } from "@vantage-ai/sdk/advanced/abTesting";

const abTest = new ABTestingEngine();
abTest.registerTest({
  id: "vantage-enabled",
  variants: [
    { id: "control", weight: 50 },    // No Vantage
    { id: "treatment", weight: 50 }   // With Vantage
  ],
  sticky: true
});

if (abTest.getVariant("vantage-enabled", userId) === "treatment") {
  vantage.start();
}

// Measure impact
analytics.track("checkout_completed", {
  vantage_enabled: abTest.getVariant("vantage-enabled", userId) === "treatment"
});
```

---

## Common Pitfalls

### 1. ❌ Forgetting to Stop Vantage on Unmount

**Problem:** Memory leaks, duplicate event listeners

```typescript
// ❌ Bad
function App() {
  const vantage = initVantage(config);
  vantage.start();
  return <div>...</div>;
}
```

**✅ Fix:**
```typescript
function App() {
  const { start, stop } = useVantage(config);

  useEffect(() => {
    start();
    return () => stop(); // Clean up!
  }, [start, stop]);
}
```

---

### 2. ❌ Too Many Recommendations

**Problem:** Users get overwhelmed, ignore all help

**✅ Solution:**
- Max 3-5 recommendations per session
- Use deduplication
- Prioritize critical issues

---

### 3. ❌ Not Testing Playbooks

**Problem:** Typos, regex errors, invalid conditions go to production

**✅ Solution:**
- Validate in CI/CD
- Unit test matching logic
- Use TypeScript for type safety

---

### 4. ❌ Blocking Main Thread

**Problem:** Slow detectors cause UI jank

**✅ Solution:**
- Profile in development
- Use debouncing/throttling
- Set performance budgets

---

### 5. ❌ Ignoring Mobile Users

**Problem:** Widgets don't work on small screens

**✅ Solution:**
- Test on mobile devices
- Use responsive widgets
- Consider mobile-specific playbooks

```typescript
const isMobile = window.innerWidth < 768;

{
  recommendation: {
    widget: isMobile ? "toast" : "banner"
  }
}
```

---

## Performance Budget

**Recommended targets:**

| Metric | Target | Critical |
|--------|--------|----------|
| Initial bundle size | < 30KB gzipped | < 50KB |
| Detector latency (p95) | < 5ms | < 10ms |
| Recommendation latency | < 10ms | < 20ms |
| Widget render time | < 20ms | < 50ms |
| Memory usage (peak) | < 50MB | < 100MB |
| Events per second | > 100 | > 50 |

---

## Summary Checklist

Before deploying to production:

- [ ] All playbooks validated
- [ ] PII filtering enabled
- [ ] Rate limiting configured
- [ ] Analytics tracking implemented
- [ ] Performance profiled
- [ ] Error tracking setup
- [ ] A/B tests configured (if applicable)
- [ ] Mobile testing complete
- [ ] Cleanup handlers implemented
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Localization complete (if applicable)

---

**Next Steps:**

- Read [Deployment Guide](./DEPLOYMENT.md)
- Review [API Reference](./API_REFERENCE.md)
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

**Last Updated:** 2025-01-17
**Version:** 3.0.0
