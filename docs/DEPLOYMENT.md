# Vantage AI - Deployment Guide

## Overview

This guide covers deploying Vantage AI to production environments, including build optimization, monitoring, and scaling strategies.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Build Optimization](#build-optimization)
3. [Environment Configuration](#environment-configuration)
4. [CDN Deployment](#cdn-deployment)
5. [Monitoring & Observability](#monitoring--observability)
6. [Performance Tuning](#performance-tuning)
7. [Security Hardening](#security-hardening)
8. [Rollout Strategies](#rollout-strategies)
9. [Platform-Specific Guides](#platform-specific-guides)

---

## Pre-Deployment Checklist

Before deploying to production:

### Code Quality
- [ ] All playbooks validated (`npm run validate:playbooks`)
- [ ] Unit tests passing (`npm test`)
- [ ] Integration tests passing
- [ ] E2E tests passing (if applicable)
- [ ] TypeScript compilation successful
- [ ] Linting passing (`npm run lint`)

### Security
- [ ] PII filtering enabled
- [ ] XSS sanitization active
- [ ] Rate limiting configured
- [ ] CSP headers configured
- [ ] No hardcoded secrets
- [ ] Dependencies audited (`npm audit`)

### Performance
- [ ] Bundle size < 50KB gzipped
- [ ] Detector latency profiled
- [ ] Memory usage checked
- [ ] Debouncing configured
- [ ] Lazy loading implemented

### Analytics
- [ ] Analytics adapter configured
- [ ] Events tracking tested
- [ ] User identification working
- [ ] Privacy compliance verified

### Documentation
- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API docs current
- [ ] Deployment runbook created

---

## Build Optimization

### 1. Tree Shaking

Ensure only used modules are bundled:

```typescript
// ✅ Good - Import only what you need
import { initVantage } from "@vantage-ai/sdk";
import { Banner } from "@vantage-ai/widgets";

// ❌ Bad - Imports entire package
import * as Vantage from "@vantage-ai/sdk";
```

### 2. Code Splitting

Split Vantage into async chunk:

#### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vantage: [
            "@vantage-ai/sdk",
            "@vantage-ai/widgets",
            "@vantage-ai/react-hooks"
          ]
        }
      }
    }
  }
});
```

#### Webpack Configuration

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vantage: {
          test: /[\\/]node_modules[\\/]@vantage-ai/,
          name: "vantage",
          chunks: "all"
        }
      }
    }
  }
};
```

### 3. Lazy Load Analytics Adapters

```typescript
// Lazy load heavy analytics dependencies
const analytics = new AnalyticsManager();

// Load Amplitude only when needed
const loadAmplitude = async () => {
  const { createAmplitudeAdapter } = await import("@vantage-ai/analytics");
  const adapter = createAmplitudeAdapter({ apiKey: process.env.AMPLITUDE_KEY });
  analytics.addAdapter(adapter);
};

// Trigger on user consent
if (userConsent.analytics) {
  loadAmplitude();
}
```

### 4. Minification

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  }
});
```

### 5. Bundle Analysis

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Generate report
npm run build
```

```typescript
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

**Target:** Vantage AI < 50KB gzipped

---

## Environment Configuration

### 1. Environment Variables

```bash
# .env.production
VITE_VANTAGE_MODE=ai
VITE_VANTAGE_DEBUG=false
VITE_AMPLITUDE_API_KEY=your_amplitude_key
VITE_SEGMENT_WRITE_KEY=your_segment_key
VITE_SENTRY_DSN=your_sentry_dsn
```

### 2. Build-Time Configuration

```typescript
// config/vantage.config.ts
export const vantageConfig = {
  mode: (import.meta.env.VITE_VANTAGE_MODE as "lite" | "ai") || "lite",
  debug: import.meta.env.VITE_VANTAGE_DEBUG === "true",

  performance: {
    debounceMs: 300,
    throttleMs: 100,
    maxBufferSize: 1000
  },

  security: {
    enablePIIFiltering: true,
    rateLimitPerMinute: 10,
    enableCSP: true
  },

  analytics: {
    amplitude: {
      apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY
    },
    segment: {
      writeKey: import.meta.env.VITE_SEGMENT_WRITE_KEY
    }
  }
};
```

### 3. Runtime Configuration

```typescript
// Load playbooks dynamically based on environment
const loadPlaybooks = async () => {
  if (import.meta.env.PROD) {
    return (await import("./playbooks/production")).default;
  } else {
    return (await import("./playbooks/development")).default;
  }
};

const vantage = initVantage({
  playbooks: await loadPlaybooks()
});
```

---

## CDN Deployment

### Option 1: UMD Bundle via CDN

```html
<!-- Load from unpkg -->
<script src="https://unpkg.com/@vantage-ai/sdk@3.0.0/dist/vantage.umd.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@vantage-ai/widgets@3.0.0/dist/widgets.css">

<script>
  const vantage = VantageAI.initVantage({
    mode: "lite",
    playbooks: [/* ... */]
  });

  vantage.start();
</script>
```

### Option 2: ES Modules via CDN

```html
<script type="module">
  import { initVantage } from "https://cdn.skypack.dev/@vantage-ai/sdk@3.0.0";

  const vantage = initVantage({ /* ... */ });
  vantage.start();
</script>
```

### Option 3: Self-Hosted CDN

```bash
# Build for CDN
npm run build

# Upload dist/ to your CDN
aws s3 sync dist/ s3://your-cdn-bucket/vantage/3.0.0/
```

```html
<!-- Load from your CDN -->
<script src="https://cdn.yourdomain.com/vantage/3.0.0/vantage.umd.js"></script>
```

---

## Monitoring & Observability

### 1. Performance Monitoring

#### Datadog Integration

```typescript
import { VantageProfiler } from "@vantage-ai/devtools";
import { datadogRum } from "@datadog/browser-rum";

const profiler = new VantageProfiler();
profiler.start();

setInterval(() => {
  const report = profiler.getReport();

  // Send metrics to Datadog
  Object.entries(report.detectors).forEach(([name, metrics]) => {
    datadogRum.addTiming(`vantage.detector.${name}.p95`, metrics.p95);
  });

  datadogRum.addTiming("vantage.memory.avg", report.memory.avg);
}, 60000); // Every minute
```

#### New Relic Integration

```typescript
if (window.newrelic) {
  const report = profiler.getReport();

  Object.entries(report.detectors).forEach(([name, metrics]) => {
    window.newrelic.addPageAction("VantageMetric", {
      detector: name,
      latency_p95: metrics.p95,
      count: metrics.count
    });
  });
}
```

### 2. Error Tracking

#### Sentry Integration

```typescript
import * as Sentry from "@sentry/react";

const vantage = initVantage({
  // ... config
  onError: (error, context) => {
    Sentry.captureException(error, {
      tags: {
        component: "vantage-ai",
        detector: context?.detector
      },
      extra: {
        route: window.location.pathname,
        userId: getCurrentUserId(),
        context
      }
    });
  }
});
```

### 3. Analytics Tracking

```typescript
// Track Vantage health metrics
analytics.track("vantage_health_check", {
  detectors_active: 8,
  playbooks_loaded: playbooks.length,
  recommendations_shown_today: recommendationCount,
  average_response_time: avgResponseTime
});
```

### 4. Custom Dashboards

**Grafana Dashboard Query Examples:**

```promql
# Average detector latency
avg(vantage_detector_latency_milliseconds{percentile="p95"}) by (detector)

# Memory usage over time
vantage_memory_usage_megabytes

# Recommendations triggered per hour
rate(vantage_recommendations_triggered_total[1h])

# Error rate
rate(vantage_errors_total[5m])
```

---

## Performance Tuning

### 1. Optimize Detector Execution

```typescript
import { debounce, throttle } from "@vantage-ai/sdk/utils/performance";

// Debounce expensive operations
const debouncedFormAnalysis = debounce((formData) => {
  // Analyze form
}, 500);

// Throttle high-frequency events
const throttledScrollHandler = throttle(() => {
  // Handle scroll
}, 100);
```

### 2. Limit Event Buffer Size

```typescript
import { BoundedBuffer } from "@vantage-ai/sdk/utils/performance";

const eventBuffer = new BoundedBuffer<EventContext>(1000); // Max 1000 events

// Automatically removes oldest when full
eventBuffer.push(newEvent);
```

### 3. Implement Request Coalescing

```typescript
// Batch multiple analytics events
let eventQueue: any[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function trackEvent(event: string, properties: any) {
  eventQueue.push({ event, properties });

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      analytics.trackBatch(eventQueue);
      eventQueue = [];
      flushTimer = null;
    }, 1000); // Flush every second
  }
}
```

### 4. Use Web Workers (Advanced)

```typescript
// detector.worker.ts
self.addEventListener("message", (e) => {
  const { events } = e.data;

  // Run detection in worker thread
  const signals = runDetectors(events);

  self.postMessage({ signals });
});

// Main thread
const worker = new Worker("detector.worker.js");
worker.postMessage({ events: eventBuffer.getAll() });

worker.addEventListener("message", (e) => {
  const { signals } = e.data;
  processSignals(signals);
});
```

---

## Security Hardening

### 1. Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.amplitude.com https://cdn.segment.com;
  connect-src 'self' https://api.amplitude.com https://api.segment.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### 2. Subresource Integrity

```html
<script
  src="https://unpkg.com/@vantage-ai/sdk@3.0.0/dist/vantage.umd.js"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

### 3. HTTPS Only

```javascript
// Redirect HTTP to HTTPS
if (location.protocol !== "https:" && location.hostname !== "localhost") {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

### 4. Rate Limiting

```typescript
import { RateLimiter } from "@vantage-ai/sdk/security/sanitizer";

const recommendationLimiter = new RateLimiter(10, 60000); // 10 per minute
const analyticsLimiter = new RateLimiter(100, 60000); // 100 per minute

if (!recommendationLimiter.isAllowed(userId)) {
  console.warn("Recommendation rate limit exceeded");
  return;
}
```

---

## Rollout Strategies

### 1. Feature Flags

```typescript
// Using LaunchDarkly
import { useLDClient } from "launchdarkly-react-client-sdk";

function App() {
  const ldClient = useLDClient();
  const vantageEnabled = ldClient?.variation("vantage-recommendations", false);

  if (vantageEnabled) {
    const { recommendations } = useVantage(config);
    // ... show recommendations
  }
}
```

### 2. Percentage Rollout

```typescript
// Gradually increase from 5% → 25% → 50% → 100%
const rolloutPercentage = 25;
const userHash = hashUserId(userId);

if (userHash % 100 < rolloutPercentage) {
  vantage.start();
}
```

### 3. Canary Deployment

```typescript
// Deploy to canary environment first
const isCanary = window.location.hostname.includes("canary");

const vantageConfig = {
  mode: isCanary ? "ai" : "lite",
  playbooks: isCanary ? experimentalPlaybooks : stablePlaybooks
};
```

### 4. A/B Testing

```typescript
import { ABTestingEngine } from "@vantage-ai/sdk/advanced/abTesting";

const abTest = new ABTestingEngine();
abTest.registerTest({
  id: "vantage-enabled",
  variants: [
    { id: "control", weight: 50 },
    { id: "treatment", weight: 50 }
  ]
});

const variant = abTest.getVariant("vantage-enabled", userId);

if (variant === "treatment") {
  vantage.start();
}

// Measure impact
analytics.track("checkout_completed", {
  vantage_enabled: variant === "treatment"
});
```

---

## Platform-Specific Guides

### Vercel

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_VANTAGE_MODE": "ai",
    "VITE_AMPLITUDE_API_KEY": "@amplitude-key"
  },
  "headers": [
    {
      "source": "/.*",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_VANTAGE_MODE = "ai"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

### AWS CloudFront + S3

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket/

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Security headers
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header Content-Security-Policy "default-src 'self'";
}
```

---

## Post-Deployment

### 1. Smoke Tests

```bash
# Run smoke tests after deployment
npm run test:smoke
```

```typescript
// smoke-test.spec.ts
import { test, expect } from "@playwright/test";

test("Vantage recommendations work in production", async ({ page }) => {
  await page.goto("https://yourapp.com/checkout");

  // Simulate friction
  for (let i = 0; i < 5; i++) {
    await page.click("#submit");
  }

  // Check for recommendation
  await expect(page.locator(".vantage-banner")).toBeVisible({ timeout: 5000 });
});
```

### 2. Monitor Key Metrics

**First 24 hours:**
- Error rate
- Recommendation show rate
- User engagement rate
- Performance metrics (latency, memory)

**Dashboard Queries:**

```sql
-- Recommendation effectiveness
SELECT
  recommendation_id,
  COUNT(*) as shown_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(time_to_conversion) as avg_time
FROM vantage_events
WHERE event = 'recommendation_shown'
  AND date >= CURRENT_DATE - 7
GROUP BY recommendation_id;
```

### 3. Rollback Plan

```bash
# If issues detected, rollback
git revert HEAD
npm run build
npm run deploy

# Or use feature flag
launchdarkly.toggle("vantage-recommendations", false);
```

---

## Checklist: Production Deployment

- [ ] Environment variables configured
- [ ] Build optimized and minified
- [ ] Bundle size verified (< 50KB)
- [ ] Analytics tracking working
- [ ] Error tracking configured
- [ ] Performance monitoring active
- [ ] Security headers configured
- [ ] CSP policy set
- [ ] Rate limiting enabled
- [ ] Smoke tests passing
- [ ] Rollback plan ready
- [ ] Monitoring dashboards created
- [ ] On-call rotation notified
- [ ] Documentation updated

---

## Troubleshooting Production Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common production issues and solutions.

---

**Last Updated:** 2025-01-17
**Version:** 3.0.0
