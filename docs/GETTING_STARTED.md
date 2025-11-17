# Vantage AI - Getting Started Tutorial

## Overview

This step-by-step tutorial will guide you through setting up Vantage AI in your application, from installation to your first recommendation.

**Time to complete:** 15-20 minutes

---

## Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- React 18+ or Vue 3+ (optional - vanilla JS supported)
- Basic understanding of TypeScript (recommended)

---

## Step 1: Installation

### Option A: React Application

```bash
# Install core SDK and React hooks
npm install @vantage-ai/sdk @vantage-ai/react-hooks @vantage-ai/widgets

# Or with yarn
yarn add @vantage-ai/sdk @vantage-ai/react-hooks @vantage-ai/widgets

# Or with pnpm
pnpm add @vantage-ai/sdk @vantage-ai/react-hooks @vantage-ai/widgets
```

### Option B: Vue 3 Application

```bash
npm install @vantage-ai/sdk @vantage-ai/vue @vantage-ai/widgets
```

### Option C: Vanilla JavaScript

```bash
npm install @vantage-ai/sdk @vantage-ai/widgets
```

---

## Step 2: Create Your First Playbook

Create a file `playbooks/checkout-help.ts`:

```typescript
import type { Playbook } from "@vantage-ai/sdk";

export const checkoutHelpPlaybook: Playbook = {
  id: "checkout-help",
  version: "1.0.0",
  description: "Help users struggling with checkout",
  priority: 80,

  // When to trigger
  match: {
    categories: ["friction"],           // On friction signals
    routePattern: "/checkout",          // Only on checkout page
    minScore: 0.7                       // High confidence (70%+)
  },

  // What to show
  recommendation: {
    id: "checkout-assist-1",
    title: "Need help with checkout?",
    message: "We're here to assist! Our checkout accepts all major credit cards and PayPal.",
    severity: "info",
    link: "/help/checkout",
    widget: "banner"
  }
};
```

**What this does:**
- Detects when users show friction (rage clicks, form failures, etc.)
- Only activates on `/checkout` page
- Shows a helpful banner with link to help docs

---

## Step 3: Initialize Vantage

### React Implementation

Create `hooks/useVantageSetup.ts`:

```typescript
import { useEffect } from "react";
import { useVantage } from "@vantage-ai/react-hooks";
import { checkoutHelpPlaybook } from "../playbooks/checkout-help";

export function useVantageSetup() {
  const { start, stop, recommendations } = useVantage({
    mode: "lite",                       // Use rule-based detection
    playbooks: [checkoutHelpPlaybook],
    debug: process.env.NODE_ENV === "development"
  });

  useEffect(() => {
    start();
    return () => stop();                // Clean up on unmount
  }, [start, stop]);

  return { recommendations };
}
```

Use in your `App.tsx`:

```typescript
import { Banner } from "@vantage-ai/widgets";
import { useVantageSetup } from "./hooks/useVantageSetup";

function App() {
  const { recommendations } = useVantageSetup();

  return (
    <div className="app">
      {/* Your app content */}
      <YourAppRoutes />

      {/* Vantage recommendations */}
      {recommendations.map((rec) => (
        <Banner
          key={rec.id}
          title={rec.title}
          message={rec.message}
          severity={rec.severity}
          link={rec.link}
          onClose={() => console.log("Dismissed:", rec.id)}
        />
      ))}
    </div>
  );
}
```

### Vue 3 Implementation

Create `composables/useVantageSetup.ts`:

```typescript
import { onMounted, onUnmounted } from "vue";
import { useVantage } from "@vantage-ai/vue";
import { checkoutHelpPlaybook } from "../playbooks/checkout-help";

export function useVantageSetup() {
  const { start, stop, recommendations } = useVantage({
    mode: "lite",
    playbooks: [checkoutHelpPlaybook],
    debug: import.meta.env.DEV
  });

  onMounted(() => start());
  onUnmounted(() => stop());

  return { recommendations };
}
```

Use in your `App.vue`:

```vue
<script setup>
import { Banner } from "@vantage-ai/widgets";
import { useVantageSetup } from "./composables/useVantageSetup";

const { recommendations } = useVantageSetup();
</script>

<template>
  <div class="app">
    <!-- Your app content -->
    <RouterView />

    <!-- Vantage recommendations -->
    <Banner
      v-for="rec in recommendations"
      :key="rec.id"
      :title="rec.title"
      :message="rec.message"
      :severity="rec.severity"
      :link="rec.link"
      @close="console.log('Dismissed:', rec.id)"
    />
  </div>
</template>
```

### Vanilla JS Implementation

```typescript
import { initVantage } from "@vantage-ai/sdk";
import { Banner } from "@vantage-ai/widgets";
import { checkoutHelpPlaybook } from "./playbooks/checkout-help";

const vantage = initVantage({
  mode: "lite",
  playbooks: [checkoutHelpPlaybook],
  onTrigger: (recommendation) => {
    // Show banner when recommendation triggered
    const banner = new Banner({
      title: recommendation.title,
      message: recommendation.message,
      severity: recommendation.severity,
      link: recommendation.link,
      onClose: () => {
        banner.remove();
      }
    });

    document.body.appendChild(banner.render());
  }
});

vantage.start();

// Clean up when page unloads
window.addEventListener("beforeunload", () => {
  vantage.stop();
});
```

---

## Step 4: Test Your Setup

### Manual Testing

1. Navigate to your checkout page (`/checkout`)
2. Rapidly click the submit button 5+ times (rage click)
3. You should see the help banner appear!

### Verification Checklist

- [ ] Banner appears after rage clicks
- [ ] Banner only shows on `/checkout` page
- [ ] Banner has dismiss button
- [ ] Help link works
- [ ] Banner doesn't reappear immediately after dismissing

---

## Step 5: Add More Detectors

Vantage includes 8 built-in detectors. Let's create playbooks for more scenarios:

### Form Failure Help

```typescript
export const formHelpPlaybook: Playbook = {
  id: "form-help",
  match: {
    categories: ["error"],
    minScore: 0.6
  },
  recommendation: {
    id: "form-assist-1",
    title: "Form not submitting?",
    message: "Please check that all required fields are filled correctly. Look for red error messages.",
    severity: "warning",
    widget: "tooltip",
    targetSelector: "form"
  }
};
```

### Navigation Confusion

```typescript
export const navigationHelpPlaybook: Playbook = {
  id: "navigation-help",
  match: {
    categories: ["confusion"],
    minScore: 0.5
  },
  recommendation: {
    id: "nav-assist-1",
    title: "Lost?",
    message: "Use the search bar or navigation menu to find what you need.",
    severity: "info",
    widget: "toast"
  }
};
```

**Add to your config:**

```typescript
playbooks: [
  checkoutHelpPlaybook,
  formHelpPlaybook,
  navigationHelpPlaybook
]
```

---

## Step 6: Add Analytics Tracking

Track when recommendations are shown and how users interact with them.

### Install Analytics Package

```bash
npm install @vantage-ai/analytics
```

### Configure Amplitude (or Segment, GA4)

```typescript
import { AnalyticsManager, createAmplitudeAdapter } from "@vantage-ai/analytics";

const analytics = new AnalyticsManager();
analytics.addAdapter(createAmplitudeAdapter({
  apiKey: process.env.VITE_AMPLITUDE_KEY!
}));

// Track when recommendations are shown
const { start, stop, recommendations } = useVantage({
  mode: "lite",
  playbooks: [/* ... */],
  onTrigger: (rec) => {
    analytics.track("vantage_recommendation_shown", {
      recommendation_id: rec.id,
      severity: rec.severity,
      route: window.location.pathname
    });
  }
});

// Track user interactions
function handleBannerClick(rec) {
  analytics.track("vantage_recommendation_clicked", {
    recommendation_id: rec.id
  });
}

function handleBannerDismiss(rec) {
  analytics.track("vantage_recommendation_dismissed", {
    recommendation_id: rec.id
  });
}
```

---

## Step 7: Customize Widget Appearance

### Option A: CSS Overrides

```css
/* Override banner styles */
.vantage-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.vantage-banner__title {
  font-family: "Inter", sans-serif;
  font-weight: 700;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .vantage-banner {
    background: #1a1a1a;
    border: 1px solid #333;
  }
}
```

### Option B: Custom Widget Component

```typescript
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

function CustomBanner({ title, message, onClose }) {
  return (
    <div className="my-custom-banner">
      <h3>{title}</h3>
      <p dangerouslySetInnerHTML={{ __html: sanitizeHTML(message) }} />
      <button onClick={onClose}>Got it!</button>
    </div>
  );
}

// Use in app
{recommendations.map((rec) => (
  <CustomBanner key={rec.id} {...rec} />
))}
```

---

## Step 8: Advanced Features

### A/B Testing Different Messages

```typescript
import { ABTestingEngine } from "@vantage-ai/sdk/advanced/abTesting";

const abTest = new ABTestingEngine();
abTest.registerTest({
  id: "checkout-message-test",
  variants: [
    { id: "friendly", weight: 50 },
    { id: "direct", weight: 50 }
  ],
  sticky: true
});

// Customize message based on variant
const variant = abTest.getVariant("checkout-message-test", userId);

const message = variant === "friendly"
  ? "We're here to help! Having trouble?"
  : "Checkout issue? Click here for help.";
```

### User Segmentation

```typescript
import { SegmentationEngine } from "@vantage-ai/sdk/advanced/segmentation";

const segments = new SegmentationEngine();
segments.registerSegment({
  id: "new-users",
  conditions: [
    { field: "signupDate", operator: "greater_than", value: Date.now() - 7 * 86400000 }
  ]
});

// Show extra help for new users
if (segments.isInSegment("new-users", currentUser)) {
  recommendation.message += " Need a guided tour?";
}
```

---

## Step 9: Production Checklist

Before deploying to production:

### 1. Validate Playbooks

```bash
# Add to package.json scripts
{
  "validate:playbooks": "node scripts/validate-playbooks.js"
}
```

```javascript
// scripts/validate-playbooks.js
import { validatePlaybook } from "@vantage-ai/devtools";
import playbooks from "../src/playbooks/index.js";

let hasErrors = false;

playbooks.forEach((playbook) => {
  const result = validatePlaybook(playbook);

  if (!result.valid) {
    console.error(`❌ Invalid playbook: ${playbook.id}`);
    result.errors.forEach((err) => {
      console.error(`  - ${err.field}: ${err.message}`);
    });
    hasErrors = true;
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️  Warnings for playbook: ${playbook.id}`);
    result.warnings.forEach((warn) => {
      console.warn(`  - ${warn.field}: ${warn.message}`);
    });
  }
});

if (hasErrors) {
  process.exit(1);
}

console.log("✅ All playbooks valid!");
```

### 2. Enable Performance Monitoring

```typescript
import { VantageProfiler } from "@vantage-ai/devtools";

if (process.env.NODE_ENV === "production") {
  const profiler = new VantageProfiler();
  profiler.start();

  setInterval(() => {
    const report = profiler.getReport();

    // Send to monitoring service
    monitoring.sendMetrics({
      vantage_detector_latency: report.detectors,
      vantage_memory: report.memory.avg
    });
  }, 60000);
}
```

### 3. Set Up Error Tracking

```typescript
vantage.onError((error) => {
  Sentry.captureException(error, {
    tags: { component: "vantage-ai" }
  });
});
```

### 4. Configure Rate Limiting

```typescript
import { RateLimiter } from "@vantage-ai/sdk/security/sanitizer";

const limiter = new RateLimiter(5, 60000); // 5 per minute

onTrigger: (rec) => {
  if (!limiter.isAllowed(userId)) {
    return; // Don't overwhelm users
  }
  showRecommendation(rec);
}
```

---

## Troubleshooting

### Issue: Recommendations Not Appearing

**Check:**
1. Is Vantage started? (`vantage.start()` called)
2. Are you on the correct route? (check `routePattern`)
3. Is the score high enough? (check `minScore`)
4. Open browser console for debug logs (if `debug: true`)

**Debug:**
```typescript
const vantage = initVantage({
  debug: true, // Enable logging
  onTrigger: (rec) => {
    console.log("✅ Recommendation triggered:", rec);
  }
});
```

### Issue: Too Many Recommendations

**Solution:** Add deduplication

```typescript
import { Deduplicator } from "@vantage-ai/sdk/utils/performance";

const dedup = new Deduplicator((rec) => rec.id, 60000);

onTrigger: (rec) => {
  if (dedup.isDuplicate(rec)) {
    return;
  }
  showRecommendation(rec);
}
```

### Issue: Performance Problems

**Solution:** Profile your setup

```typescript
import { VantageProfiler } from "@vantage-ai/devtools";

const profiler = new VantageProfiler();
profiler.start();

// After some usage...
const report = profiler.getReport();
console.log("Performance report:", report);

// Look for slow detectors (> 10ms p95)
Object.entries(report.detectors).forEach(([name, metrics]) => {
  if (metrics.p95 > 10) {
    console.warn(`${name} is slow:`, metrics);
  }
});
```

---

## Next Steps

Congratulations! You've set up Vantage AI. Here's what to explore next:

### 1. Learn More Detectors
- Read [Detector Guide](./DETECTORS.md)
- Understand [friction signals](./DETECTORS.md#friction-detectors)

### 2. Advanced Widgets
- Try [Product Tours](./API_REFERENCE.md#producttour)
- Use [Modals](./API_REFERENCE.md#modal) for critical issues
- Add [Tooltips](./API_REFERENCE.md#tooltip) for contextual help

### 3. Internationalization
- Add [multi-language support](./API_REFERENCE.md#internationalization)
- Localize your recommendations

### 4. Deep Dive
- Read [Best Practices](./BEST_PRACTICES.md)
- Check [Deployment Guide](./DEPLOYMENT.md)
- Review [API Reference](./API_REFERENCE.md)

---

## Example Projects

Explore complete examples in the `/examples` directory:

- **E-commerce Demo** - Full checkout flow with Vantage
- **SaaS Dashboard** - Onboarding and feature discovery
- **Support Portal** - Context-aware help

```bash
# Run e-commerce demo
cd examples/ecommerce-demo
npm install
npm run dev
```

---

## Community & Support

- **Documentation:** [https://docs.vantage-ai.dev](https://docs.vantage-ai.dev)
- **GitHub:** [https://github.com/nik-kale/vantage-ai](https://github.com/nik-kale/vantage-ai)
- **Issues:** [Report bugs or request features](https://github.com/nik-kale/vantage-ai/issues)

---

**Congratulations!** You're now ready to provide intelligent, context-aware guidance to your users with Vantage AI.

---

**Last Updated:** 2025-01-17
**Version:** 3.0.0
