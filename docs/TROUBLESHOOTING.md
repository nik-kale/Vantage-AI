# Vantage AI - Troubleshooting Guide

## Overview

Common issues, error messages, and solutions when working with Vantage AI.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Recommendations Not Appearing](#recommendations-not-appearing)
3. [Performance Problems](#performance-problems)
4. [Widget Display Issues](#widget-display-issues)
5. [Analytics Not Tracking](#analytics-not-tracking)
6. [Build & Bundle Errors](#build--bundle-errors)
7. [TypeScript Errors](#typescript-errors)
8. [Production Issues](#production-issues)
9. [Browser Compatibility](#browser-compatibility)

---

## Installation Issues

### Error: `Cannot find module '@vantage-ai/sdk'`

**Cause:** Package not installed or incorrect import path.

**Solution:**
```bash
# Ensure package is installed
npm install @vantage-ai/sdk

# Or with pnpm
pnpm add @vantage-ai/sdk

# Check node_modules exists
ls node_modules/@vantage-ai/
```

**Verify installation:**
```typescript
import { initVantage } from "@vantage-ai/sdk";
console.log("✅ Vantage SDK imported successfully");
```

---

### Error: `Peer dependency warnings`

**Example:**
```
npm WARN @vantage-ai/react-hooks@3.0.0 requires a peer of react@^18.0.0
```

**Cause:** Incompatible React/Vue version.

**Solution:**
```bash
# Check React version
npm list react

# Upgrade if needed
npm install react@^18.0.0 react-dom@^18.0.0
```

**Minimum versions:**
- React: 18.0.0+
- Vue: 3.0.0+
- Node: 16.0.0+

---

### Error: `Module not found: Can't resolve '@vantage-ai/widgets/dist/widgets.css'`

**Cause:** CSS not imported.

**Solution:**
```typescript
// In your main entry file (main.tsx or App.tsx)
import "@vantage-ai/widgets/dist/widgets.css";
```

Or with Vite/Webpack config:
```typescript
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      localsConvention: "camelCase"
    }
  }
});
```

---

## Recommendations Not Appearing

### Issue: No recommendations triggered

**Debug steps:**

1. **Enable debug mode:**
```typescript
const vantage = initVantage({
  mode: "lite",
  playbooks: [...],
  debug: true  // ← Enable logging
});
```

2. **Check browser console:**
```
[Vantage] Detector fired: RageClickDetector (score: 0.8)
[Vantage] Signal: { category: "friction", score: 0.8 }
[Vantage] Matching playbooks: []  ← Problem: No matches!
```

3. **Verify playbook conditions:**
```typescript
// Check route pattern
console.log("Current route:", window.location.pathname);
console.log("Pattern:", playbook.match.routePattern);

// Test regex
const regex = new RegExp(playbook.match.routePattern);
console.log("Matches:", regex.test(window.location.pathname));
```

4. **Check score threshold:**
```typescript
// Temporarily lower minScore to test
{
  match: {
    minScore: 0.1  // Lower threshold for testing
  }
}
```

5. **Verify Vantage is started:**
```typescript
const { start, isActive } = useVantage(config);

useEffect(() => {
  start();
  console.log("Vantage active:", isActive); // Should be true
}, []);
```

---

### Issue: Recommendations appear but don't show widgets

**Cause:** Widget component not rendered.

**Solution for React:**
```typescript
function App() {
  const { recommendations } = useVantage(config);

  console.log("Recommendations:", recommendations); // Check if populated

  return (
    <div>
      {recommendations.length > 0 && (
        <div className="recommendations">
          {recommendations.map((rec) => (
            <Banner key={rec.id} {...rec} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Check widget props:**
```typescript
// Log widget data
{recommendations.map((rec) => {
  console.log("Rendering recommendation:", rec);
  return <Banner key={rec.id} {...rec} />;
})}
```

---

### Issue: Recommendations only appear once

**Cause:** Deduplication preventing re-showing.

**Solution:** Clear deduplication cache or adjust TTL:
```typescript
import { Deduplicator } from "@vantage-ai/sdk/utils/performance";

// Longer TTL (30 seconds → 5 minutes)
const dedup = new Deduplicator((rec) => rec.id, 5 * 60 * 1000);

// Or disable deduplication for testing
// const dedup = null;
```

---

### Issue: Wrong route pattern matching

**Example:** Pattern `/checkout.*` not matching `/checkout/payment`

**Cause:** Regex needs start anchor.

**Solution:**
```typescript
// ❌ Bad
routePattern: "checkout.*"  // Matches anywhere

// ✅ Good
routePattern: "^/checkout.*"  // Matches from start

// ✅ Also good - exact match
routePattern: "^/checkout$"
```

**Test regex:**
```javascript
const pattern = new RegExp("^/checkout.*");
console.log(pattern.test("/checkout/payment")); // true
console.log(pattern.test("/cart/checkout")); // false
```

---

## Performance Problems

### Issue: UI lag/jank when using Vantage

**Symptoms:**
- Slow scrolling
- Delayed clicks
- High CPU usage

**Diagnosis:**
```typescript
import { VantageProfiler } from "@vantage-ai/devtools";

const profiler = new VantageProfiler();
profiler.start();

// Use app for 30 seconds...

const report = profiler.getReport();
console.log("Performance report:", report);

// Look for slow detectors
Object.entries(report.detectors).forEach(([name, metrics]) => {
  if (metrics.p95 > 10) {
    console.error(`❌ ${name} is slow: ${metrics.p95}ms (p95)`);
  }
});
```

**Solutions:**

1. **Add debouncing to high-frequency events:**
```typescript
import { debounce } from "@vantage-ai/sdk/utils/performance";

const debouncedHandler = debounce(() => {
  vantage.recordEvent(event);
}, 300);

window.addEventListener("scroll", debouncedHandler);
```

2. **Reduce buffer size:**
```typescript
import { BoundedBuffer } from "@vantage-ai/sdk/utils/performance";

const buffer = new BoundedBuffer(500); // Reduce from 1000 to 500
```

3. **Disable detectors not needed:**
```typescript
const vantage = initVantage({
  mode: "lite",
  detectors: {
    enabled: ["RageClickDetector", "FormFailureDetector"],
    disabled: ["HoverConfusionDetector", "ScrollAbandonmentDetector"]
  }
});
```

---

### Issue: Memory leak over time

**Symptoms:**
- Memory usage grows continuously
- Browser slows down after minutes/hours
- Tab crashes

**Diagnosis:**
```typescript
// Monitor memory
setInterval(() => {
  if (performance.memory) {
    console.log("Memory:", {
      used: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + " MB",
      total: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + " MB"
    });
  }
}, 5000);
```

**Solutions:**

1. **Ensure cleanup on unmount:**
```typescript
useEffect(() => {
  const { start, stop } = vantage;
  start();

  return () => {
    stop(); // ← Critical: Clean up listeners
  };
}, []);
```

2. **Clear event buffers periodically:**
```typescript
setInterval(() => {
  eventBuffer.clear();
}, 5 * 60 * 1000); // Every 5 minutes
```

3. **Limit recommendation history:**
```typescript
const [recommendations, setRecommendations] = useState([]);

useEffect(() => {
  // Keep only last 10 recommendations
  if (recommendations.length > 10) {
    setRecommendations(recommendations.slice(-10));
  }
}, [recommendations]);
```

---

## Widget Display Issues

### Issue: Widget not visible

**Check CSS:**
```typescript
// 1. Ensure CSS is imported
import "@vantage-ai/widgets/dist/widgets.css";

// 2. Check z-index
.vantage-banner {
  z-index: 9999; /* Increase if needed */
}

// 3. Check position
.vantage-banner {
  position: fixed;
  top: 20px;
  right: 20px;
}
```

**Check DOM:**
```javascript
// Widget should be in DOM
document.querySelector(".vantage-banner");
// Should return element, not null
```

**Check visibility:**
```javascript
const banner = document.querySelector(".vantage-banner");
console.log("Display:", getComputedStyle(banner).display); // Should not be "none"
console.log("Opacity:", getComputedStyle(banner).opacity); // Should not be "0"
```

---

### Issue: Widget appears but is cut off

**Cause:** Parent container has `overflow: hidden`.

**Solution:**
```css
/* Render widgets outside scrollable container */
#app {
  overflow: hidden; /* Keep this */
}

.vantage-widgets-container {
  position: fixed; /* Outside normal flow */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Don't block clicks */
  z-index: 9999;
}

.vantage-widgets-container > * {
  pointer-events: auto; /* Re-enable for widgets */
}
```

---

### Issue: Modal backdrop not working

**Cause:** Portal not rendering.

**Solution:**
```typescript
// Create portal container
const portalRoot = document.getElementById("modal-root");
if (!portalRoot) {
  const div = document.createElement("div");
  div.id = "modal-root";
  document.body.appendChild(div);
}

// Use portal for modal
import { createPortal } from "react-dom";

function ModalWrapper({ children }) {
  return createPortal(
    children,
    document.getElementById("modal-root")!
  );
}
```

---

### Issue: Tooltip positioned incorrectly

**Cause:** Target element not found or wrong position calculation.

**Debug:**
```typescript
<Tooltip
  targetSelector="#save-button"
  content="Click to save"
  onMount={() => {
    const target = document.querySelector("#save-button");
    console.log("Target element:", target);
    console.log("Position:", target?.getBoundingClientRect());
  }}
/>
```

**Fix:** Ensure target exists before showing tooltip:
```typescript
const targetExists = document.querySelector("#save-button");
if (targetExists) {
  <Tooltip targetSelector="#save-button" content="..." />
}
```

---

## Analytics Not Tracking

### Issue: Events not showing in Amplitude/Segment

**Check adapter initialization:**
```typescript
import { AnalyticsManager, createAmplitudeAdapter } from "@vantage-ai/analytics";

const analytics = new AnalyticsManager();

const adapter = createAmplitudeAdapter({
  apiKey: "YOUR_API_KEY"  // ← Check this is correct
});

await adapter.init();  // ← Ensure this completes
analytics.addAdapter(adapter);

// Test tracking
analytics.track("test_event", { test: true });
console.log("Event tracked");
```

**Check network tab:**
- Open DevTools → Network
- Filter by "amplitude" or "segment"
- Trigger event
- Should see POST request with event data

**Common issues:**

1. **API key incorrect:**
```typescript
// Check environment variable is set
console.log("API Key:", process.env.VITE_AMPLITUDE_API_KEY);
```

2. **CORS errors:**
```
Access to fetch at 'https://api.amplitude.com' blocked by CORS
```

**Fix:** CORS should work by default. If issues:
```typescript
// Use proxy in development
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      "/amplitude": {
        target: "https://api.amplitude.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amplitude/, "")
      }
    }
  }
});
```

3. **Events not flushing:**
```typescript
// Manually flush before page unload
window.addEventListener("beforeunload", async () => {
  await analytics.flush();
});
```

---

### Issue: User identification not working

**Debug:**
```typescript
// Check user ID is set
analytics.identify("user-123", {
  email: "user@example.com",
  plan: "pro"
});

// Verify in analytics platform
// Amplitude: User should appear in User Lookup
// Segment: Check Debugger
```

**Common mistake:** Identifying before adapter is ready:
```typescript
// ❌ Bad - Adapter not initialized yet
const adapter = createAmplitudeAdapter({ apiKey: "..." });
analytics.addAdapter(adapter);
analytics.identify("user-123"); // ← Too soon!

// ✅ Good - Wait for initialization
const adapter = createAmplitudeAdapter({ apiKey: "..." });
await adapter.init();
analytics.addAdapter(adapter);
analytics.identify("user-123"); // ← Now it works
```

---

## Build & Bundle Errors

### Error: `ReferenceError: process is not defined`

**Cause:** Using Node.js `process` in browser code.

**Solution:**
```typescript
// vite.config.ts
export default defineConfig({
  define: {
    "process.env": {}
  }
});
```

Or use Vite's `import.meta.env`:
```typescript
// ❌ Bad
const apiKey = process.env.VITE_API_KEY;

// ✅ Good
const apiKey = import.meta.env.VITE_API_KEY;
```

---

### Error: `Failed to resolve import "@vantage-ai/sdk/advanced/abTesting"`

**Cause:** Path mapping not configured.

**Solution:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@vantage-ai/sdk/*": ["./node_modules/@vantage-ai/sdk/dist/*"]
    }
  }
}
```

Or use full import:
```typescript
import { ABTestingEngine } from "@vantage-ai/sdk";
```

---

### Error: `Bundle size too large`

**Solution:** Code splitting

```typescript
// Lazy load Vantage
const Vantage = lazy(() => import("./components/Vantage"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Vantage />
    </Suspense>
  );
}
```

**Analyze bundle:**
```bash
npm install --save-dev rollup-plugin-visualizer
npm run build
# Open stats.html
```

---

## TypeScript Errors

### Error: `Property 'analytics' does not exist on type 'Window'`

**Cause:** TypeScript doesn't know about window.analytics.

**Solution:**
```typescript
// types/window.d.ts
interface Window {
  analytics: any;
  gtag: (...args: any[]) => void;
  dataLayer: any[];
}
```

---

### Error: `Type 'X' is not assignable to type 'Playbook'`

**Cause:** Playbook structure doesn't match interface.

**Solution:**
```typescript
import type { Playbook } from "@vantage-ai/sdk";

// Use type annotation
const playbook: Playbook = {
  id: "test",
  match: { categories: ["friction"] },
  recommendation: {
    id: "rec-1",
    title: "Help",
    message: "Need assistance?",
    severity: "info"
  }
};

// Check error message
// Example: "message is required"
// → Add missing field
```

---

## Production Issues

### Issue: Recommendations not showing in production

**Debug:**

1. **Check environment variables:**
```typescript
console.log("Environment:", {
  mode: import.meta.env.MODE,
  vantageMode: import.meta.env.VITE_VANTAGE_MODE,
  debug: import.meta.env.VITE_VANTAGE_DEBUG
});
```

2. **Check playbooks loaded:**
```typescript
console.log("Playbooks:", vantage.getPlaybooks());
// Should not be empty
```

3. **Check CSP headers:**
```
Content-Security-Policy: default-src 'self'
```
May block Vantage widgets. Add:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

4. **Check ad blockers:**
Ad blockers may block analytics. Test with blocker disabled.

---

### Issue: High error rate in production

**Monitor errors:**
```typescript
import * as Sentry from "@sentry/react";

vantage.onError((error) => {
  Sentry.captureException(error);
  console.error("Vantage error:", error);
});
```

**Common production errors:**

1. **CORS errors:** Check API endpoints allow your domain
2. **CSP violations:** Update Content-Security-Policy
3. **Memory leaks:** Ensure cleanup on page transitions
4. **Rate limiting:** User hitting limits, increase or add backoff

---

## Browser Compatibility

### Issue: Vantage not working in Safari

**Cause:** Missing polyfills for modern JavaScript features.

**Solution:**
```bash
npm install core-js
```

```typescript
// main.tsx
import "core-js/stable";
import "regenerator-runtime/runtime";
```

**Check compatibility:**
- Chrome 90+: ✅ Full support
- Firefox 88+: ✅ Full support
- Safari 14+: ✅ Full support
- Edge 90+: ✅ Full support
- IE 11: ❌ Not supported

---

### Issue: Widgets look broken in older browsers

**Solution:** Add CSS polyfills

```bash
npm install autoprefixer postcss
```

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    autoprefixer: {
      browsers: ["last 2 versions", "> 1%"]
    }
  }
};
```

---

## Getting Help

### Before Asking for Help

1. **Check documentation:**
   - [API Reference](./API_REFERENCE.md)
   - [Best Practices](./BEST_PRACTICES.md)
   - [Getting Started](./GETTING_STARTED.md)

2. **Enable debug mode:**
```typescript
const vantage = initVantage({ debug: true });
```

3. **Check browser console** for errors/warnings

4. **Search existing issues:** [GitHub Issues](https://github.com/nik-kale/vantage-ai/issues)

### Creating a Bug Report

Include:

1. **Vantage version:** `npm list @vantage-ai/sdk`
2. **Environment:** Browser, OS, React/Vue version
3. **Minimal reproduction:** CodeSandbox or GitHub repo
4. **Expected vs actual behavior**
5. **Console errors:** Full error messages
6. **Steps to reproduce**

**Template:**
```markdown
## Bug Report

**Vantage Version:** 3.0.0
**Browser:** Chrome 120
**Framework:** React 18.2.0

### Expected Behavior
Recommendations should appear on checkout page.

### Actual Behavior
No recommendations appear despite rage clicks.

### Reproduction
1. Navigate to /checkout
2. Click submit button 5 times rapidly
3. No banner appears

### Console Output
```
[Vantage] Detector fired: RageClickDetector (score: 0.8)
[Vantage] Matching playbooks: []
```

### Code
[Link to CodeSandbox]
```

---

## Common Error Messages

### `Playbook validation failed: weights must sum to 100`

**Fix:**
```typescript
variants: [
  { id: "a", weight: 50 },
  { id: "b", weight: 50 }  // Must sum to 100
]
```

---

### `Rate limit exceeded for user: user-123`

**Fix:** Increase limit or add user to allowlist:
```typescript
const limiter = new RateLimiter(20, 60000); // Increase from 10 to 20

// Or skip rate limiting for admins
if (!user.isAdmin && !limiter.isAllowed(userId)) {
  return;
}
```

---

### `Unsafe regex pattern detected`

**Fix:**
```typescript
// ❌ Unsafe
routePattern: "(a+)+"

// ✅ Safe
routePattern: "^/checkout/.*"
```

---

**Last Updated:** 2025-01-17
**Version:** 3.0.0
