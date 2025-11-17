# Vantage AI - Complete API Reference

## Overview

Comprehensive API documentation for all Vantage AI packages.

---

## Table of Contents

1. [Core SDK](#core-sdk)
2. [Widgets](#widgets)
3. [React Hooks](#react-hooks)
4. [Vue Composables](#vue-composables)
5. [Analytics](#analytics)
6. [Internationalization](#internationalization)
7. [Developer Tools](#developer-tools)
8. [Advanced Features](#advanced-features)

---

## Core SDK

### `@vantage-ai/sdk`

#### `initVantage(config: VantageConfig): Vantage`

Initialize a Vantage instance.

**Parameters:**
- `config.mode` - `"lite" | "ai"` - Operating mode
- `config.playbooks` - `Playbook[]` - Array of playbook rules
- `config.onTrigger` - `(rec: Recommendation) => void` - Callback when guidance triggered
- `config.security` - Optional security configuration
- `config.performance` - Optional performance tuning
- `config.debug` - `boolean` - Enable debug mode

**Returns:** `Vantage` instance

**Example:**
```typescript
import { initVantage } from "@vantage-ai/sdk";

const vantage = initVantage({
  mode: "lite",
  playbooks: [...],
  onTrigger: (rec) => console.log(rec),
  debug: false
});

vantage.start();
```

---

#### `class Vantage`

**Methods:**

##### `start(): void`
Start the Vantage engine. Begins monitoring user behavior.

##### `stop(): void`
Stop the Vantage engine. Pauses all monitoring.

##### `getMetrics(): VantageMetrics`
Get current performance metrics.

**Returns:**
```typescript
{
  eventCount: number;
  recommendationCount: number;
  detectorLatency: Record<string, number>;
}
```

---

### Types

#### `EventContext`
```typescript
interface EventContext {
  route: string;          // Current page route
  timestamp: number;      // Unix timestamp
  eventType: string;      // Event type
  details: Record<string, unknown>;
}
```

#### `SuspicionSignal`
```typescript
interface SuspicionSignal {
  id: string;
  score: number;          // 0-1 confidence
  category: "friction" | "error" | "confusion";
  context: EventContext[];
}
```

#### `Recommendation`
```typescript
interface Recommendation {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  link?: string;
  widget?: "banner" | "tooltip" | "checklist" | "modal" | "toast" | "tour";
}
```

#### `Playbook`
```typescript
interface Playbook {
  id: string;
  description?: string;
  version?: string;
  priority?: number;      // 0-100
  match: PlaybookMatchCondition;
  recommendation: Recommendation;
}
```

#### `PlaybookMatchCondition`
```typescript
interface PlaybookMatchCondition {
  categories?: ("friction" | "error" | "confusion")[];
  minScore?: number;      // 0-1
  routePattern?: string;  // Regex pattern
  containsText?: string[];
}
```

---

### Detectors

All detectors follow similar patterns:

#### `RageClickDetector`
```typescript
class RageClickDetector {
  recordClick(ctx: EventContext): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** 5+ clicks within 5 seconds

---

#### `FormFailureDetector`
```typescript
class FormFailureDetector {
  recordSubmit(ctx: EventContext): SuspicionSignal | null;
  clear(formId?: string): void;
}
```

**Triggers:** 3+ failed form submissions within 30 seconds

**Event Context:**
```typescript
{
  eventType: "form-submit",
  details: {
    formId: string;
    hasErrors: boolean;
  }
}
```

---

#### `NavigationLoopDetector`
```typescript
class NavigationLoopDetector {
  recordNavigation(ctx: EventContext): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** 3+ repetitions of navigation pattern within 60 seconds

---

#### `HoverConfusionDetector`
```typescript
class HoverConfusionDetector {
  recordHoverStart(ctx: EventContext): void;
  recordHoverEnd(ctx: EventContext): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** 5+ different elements hovered within 10 seconds

---

#### `ScrollAbandonmentDetector`
```typescript
class ScrollAbandonmentDetector {
  recordScroll(ctx: EventContext): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** Rapid scrolling (5+ in 3 seconds) or scroll-down then rapid scroll-up

---

#### `TimeOnElementDetector`
```typescript
class TimeOnElementDetector {
  recordFocusStart(ctx: EventContext): void;
  recordFocusEnd(ctx: EventContext): SuspicionSignal | null;
  checkCurrentFocus(currentTime: number, route: string): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** 30+ seconds focus on single element

---

#### `DeadClickDetector`
```typescript
class DeadClickDetector {
  recordClick(ctx: EventContext, hadEffect: boolean): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** 3+ clicks with no effect within 5 seconds

---

#### `ErrorCascadeDetector`
```typescript
class ErrorCascadeDetector {
  recordError(ctx: EventContext): SuspicionSignal | null;
  clear(): void;
}
```

**Triggers:** 3+ errors within 10 seconds

---

### Security

#### `sanitizeHTML(html: string): string`
Sanitize HTML to prevent XSS attacks.

```typescript
import { sanitizeHTML } from "@vantage-ai/sdk/security/sanitizer";

const safe = sanitizeHTML("<script>alert('xss')</script>");
// Returns: "&lt;script&gt;alert('xss')&lt;/script&gt;"
```

---

#### `sanitizeURL(url: string): string`
Sanitize URLs to block dangerous protocols.

```typescript
import { sanitizeURL } from "@vantage-ai/sdk/security/sanitizer";

sanitizeURL("javascript:alert('xss')"); // Returns: "#"
sanitizeURL("https://example.com");      // Returns: "https://example.com"
```

---

#### `filterPII(text: string): string`
Filter personally identifiable information from text.

```typescript
import { filterPII } from "@vantage-ai/sdk/security/sanitizer";

filterPII("Email me at john@example.com or call 555-1234");
// Returns: "Email me at [EMAIL] or call [PHONE]"
```

**Filters:**
- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- SSNs → `[SSN]`
- Credit cards → `[CREDIT_CARD]`

---

#### `class RateLimiter`
Rate limit requests to prevent abuse.

```typescript
import { RateLimiter } from "@vantage-ai/sdk/security/sanitizer";

const limiter = new RateLimiter(100, 60000); // 100 requests per minute

if (limiter.isAllowed("user-123")) {
  // Process request
} else {
  // Reject (rate limited)
}

limiter.reset("user-123"); // Reset specific user
```

**Constructor:**
- `limit: number` - Max requests
- `windowMs: number` - Time window in milliseconds

**Methods:**
- `isAllowed(key: string): boolean`
- `reset(key?: string): void`

---

### Performance Utilities

#### `debounce<T>(func: T, wait: number)`
Debounce function calls.

```typescript
import { debounce } from "@vantage-ai/sdk/utils/performance";

const debouncedSearch = debounce((query: string) => {
  // Expensive search operation
}, 300);

debouncedSearch("user input"); // Only called after 300ms of inactivity
```

---

#### `throttle<T>(func: T, limit: number)`
Throttle function calls.

```typescript
import { throttle } from "@vantage-ai/sdk/utils/performance";

const throttledScroll = throttle(() => {
  // Handle scroll
}, 100);

window.addEventListener("scroll", throttledScroll);
// Called at most once per 100ms
```

---

#### `class BoundedBuffer<T>`
Memory-safe buffer with size limit.

```typescript
import { BoundedBuffer } from "@vantage-ai/sdk/utils/performance";

const buffer = new BoundedBuffer<EventContext>(1000); // Max 1000 items

buffer.push(event);
const all = buffer.getAll();
buffer.clear();
```

---

#### `class Deduplicator<T>`
Prevent duplicate items within TTL.

```typescript
import { Deduplicator } from "@vantage-ai/sdk/utils/performance";

const dedup = new Deduplicator<Recommendation>(
  (rec) => rec.id,  // Key extractor
  30000             // 30 second TTL
);

if (!dedup.isDuplicate(recommendation)) {
  // Show recommendation
}
```

---

## Widgets

### `@vantage-ai/widgets`

All widgets support these common props:
- XSS protection via `sanitizeHTML`
- Responsive design
- Accessibility (ARIA labels, keyboard navigation)

---

### `<Banner>`

```typescript
interface BannerProps {
  title: string;
  message: string;
  severity?: "info" | "warning" | "critical";
  link?: string;
  onClose?: () => void;
}
```

**Example:**
```typescript
<Banner
  title="Need help?"
  message="We noticed you're stuck"
  severity="info"
  link="/help"
  onClose={() => console.log("Closed")}
/>
```

---

### `<Tooltip>`

```typescript
interface TooltipProps {
  content: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
  severity?: "info" | "warning" | "critical";
  onClose?: () => void;
  autoClose?: number;  // Milliseconds
}
```

**Example:**
```typescript
<Tooltip
  content="Click here to save"
  targetSelector="#save-button"
  position="bottom"
  autoClose={5000}
/>
```

---

### `<Checklist>`

```typescript
interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  link?: string;
}

interface ChecklistProps {
  title: string;
  items: ChecklistItem[];
  onItemToggle?: (id: string) => void;
  onClose?: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}
```

**Example:**
```typescript
<Checklist
  title="Getting Started"
  items={[
    { id: "1", label: "Create account", completed: true },
    { id: "2", label: "Add payment", completed: false, link: "/billing" }
  ]}
  onItemToggle={(id) => console.log("Toggled:", id)}
  position="bottom-right"
/>
```

---

### `<Modal>`

```typescript
interface ModalProps {
  title: string;
  content: string;
  severity?: "info" | "warning" | "critical";
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  onClose?: () => void;
}
```

**Example:**
```typescript
<Modal
  title="Confirm Delete"
  content="Are you sure you want to delete this?"
  severity="critical"
  primaryAction={{
    label: "Delete",
    onClick: () => handleDelete()
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: () => handleClose()
  }}
/>
```

---

### `<Toast>`

```typescript
interface ToastProps {
  message: string;
  severity?: "info" | "success" | "warning" | "error";
  duration?: number;  // Milliseconds, 0 = no auto-close
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center" | "bottom-center";
  onClose?: () => void;
}
```

**Example:**
```typescript
<Toast
  message="Changes saved successfully"
  severity="success"
  duration={3000}
  position="bottom-right"
/>
```

---

### `<ProductTour>`

```typescript
interface TourStep {
  target: string;      // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  showSkip?: boolean;
}

interface ProductTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}
```

**Example:**
```typescript
<ProductTour
  steps={[
    {
      target: "#create-button",
      title: "Create Your First Project",
      content: "Click here to get started",
      position: "bottom"
    },
    {
      target: "#settings",
      title: "Customize Settings",
      content: "Adjust your preferences"
    }
  ]}
  onComplete={() => console.log("Tour completed")}
  onSkip={() => console.log("Tour skipped")}
/>
```

---

## React Hooks

### `@vantage-ai/react-hooks`

#### `useVantage(config: VantageConfig)`

Main React hook for Vantage integration.

**Returns:**
```typescript
{
  start: () => void;
  stop: () => void;
  isActive: boolean;
  recommendations: Recommendation[];
  clearRecommendations: () => void;
  instance: Vantage | null;
}
```

**Example:**
```typescript
import { useVantage } from "@vantage-ai/react-hooks";

function App() {
  const { start, stop, isActive, recommendations } = useVantage({
    mode: "lite",
    playbooks: [...]
  });

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return (
    <div>
      {recommendations.map((rec) => (
        <Banner key={rec.id} {...rec} />
      ))}
    </div>
  );
}
```

---

#### `useRecommendation()`

Access current recommendation state.

**Returns:**
```typescript
{
  current: Recommendation | null;
  history: Recommendation[];
  dismiss: () => void;
}
```

---

#### `useGuidance()`

Manual guidance control.

**Returns:**
```typescript
{
  showGuidance: (id: string, rec: Recommendation) => void;
  hideGuidance: (id: string) => void;
  isActive: (id: string) => boolean;
  activeGuidance: string[];
}
```

---

#### `usePlaybook()`

Playbook management.

**Returns:**
```typescript
{
  playbooks: Playbook[];
  loading: boolean;
  loadPlaybooks: (url: string) => Promise<void>;
  addPlaybook: (playbook: Playbook) => void;
  removePlaybook: (id: string) => void;
}
```

---

#### `useAnalytics(adapter: AnalyticsAdapter)`

Analytics integration.

**Returns:**
```typescript
{
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name?: string, properties?: Record<string, any>) => void;
}
```

---

## Vue Composables

### `@vantage-ai/vue`

#### `useVantage(config: VantageConfig)`

Vue 3 Composition API integration.

**Returns:**
```typescript
{
  isActive: Ref<boolean>;
  recommendations: Ref<Recommendation[]>;
  start: () => void;
  stop: () => void;
  clearRecommendations: () => void;
  instance: ComputedRef<Vantage | null>;
}
```

**Example:**
```vue
<script setup>
import { useVantage } from "@vantage-ai/vue";

const { isActive, recommendations, start } = useVantage({
  mode: "lite",
  playbooks: [...]
});

onMounted(() => start());
</script>
```

---

## Analytics

### `@vantage-ai/analytics`

#### `class AnalyticsManager`

Centralized analytics manager that supports multiple platforms simultaneously.

**Constructor:**
```typescript
const analytics = new AnalyticsManager();
```

**Methods:**

##### `addAdapter(adapter: AnalyticsAdapter): void`
Add an analytics adapter to the manager.

```typescript
import { AnalyticsManager, createAmplitudeAdapter } from "@vantage-ai/analytics";

const analytics = new AnalyticsManager();
analytics.addAdapter(createAmplitudeAdapter({ apiKey: "your-api-key" }));
```

##### `removeAdapter(name: string): void`
Remove an analytics adapter by name.

```typescript
analytics.removeAdapter("amplitude");
```

##### `track(event: string, properties?: Record<string, any>): void`
Track an event across all registered adapters.

```typescript
analytics.track("vantage_recommendation_shown", {
  recommendation_id: rec.id,
  severity: rec.severity,
  widget: rec.widget
});
```

##### `identify(userId: string, traits?: Record<string, any>): void`
Identify a user across all registered adapters.

```typescript
analytics.identify("user-123", {
  email: "user@example.com",
  plan: "pro",
  signupDate: "2024-01-15"
});
```

##### `page(name?: string, properties?: Record<string, any>): void`
Track a page view across all registered adapters.

```typescript
analytics.page("Dashboard", {
  section: "overview",
  referrer: "/login"
});
```

##### `enable(): void`
Enable analytics tracking.

##### `disable(): void`
Disable analytics tracking (useful for privacy compliance).

##### `flush(): Promise<void>`
Flush all queued events across all adapters.

```typescript
await analytics.flush();
```

---

### Analytics Adapters

#### `AnalyticsAdapter` Interface

All analytics adapters must implement this interface:

```typescript
interface AnalyticsAdapter {
  name: string;
  init(config: any): Promise<void>;
  track(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name?: string, properties?: Record<string, any>): void;
  group?(groupId: string, traits?: Record<string, any>): void;
  alias?(newId: string, previousId?: string): void;
  flush?(): Promise<void>;
  reset?(): void;
}
```

---

#### Amplitude Adapter

**Package:** `@vantage-ai/analytics`

```typescript
import { createAmplitudeAdapter } from "@vantage-ai/analytics";

const amplitudeAdapter = createAmplitudeAdapter({
  apiKey: "your-amplitude-api-key",
  userId: "user-123",
  serverUrl: "https://custom-server.amplitude.com" // Optional
});
```

**Configuration:**
```typescript
interface AmplitudeConfig {
  apiKey: string;
  userId?: string;
  serverUrl?: string;
}
```

**Methods:**
- `track(event, properties)` - Track event
- `identify(userId, traits)` - Identify user with Amplitude Identify API
- `page(name, properties)` - Track page view
- `flush()` - Flush queued events
- `reset()` - Reset user identity

---

#### Segment Adapter

**Package:** `@vantage-ai/analytics`

```typescript
import { createSegmentAdapter } from "@vantage-ai/analytics";

const segmentAdapter = createSegmentAdapter({
  writeKey: "your-segment-write-key"
});
```

**Configuration:**
```typescript
interface SegmentConfig {
  writeKey: string;
}
```

**Methods:**
- `track(event, properties)` - Track event
- `identify(userId, traits)` - Identify user
- `page(name, properties)` - Track page view
- `group(groupId, traits)` - Associate user with group
- `alias(newId, previousId)` - Alias user identities
- `reset()` - Reset user identity

---

#### Google Analytics 4 Adapter

**Package:** `@vantage-ai/analytics`

```typescript
import { createGoogleAnalyticsAdapter } from "@vantage-ai/analytics";

const gaAdapter = createGoogleAnalyticsAdapter({
  measurementId: "G-XXXXXXXXXX"
});
```

**Configuration:**
```typescript
interface GoogleAnalyticsConfig {
  measurementId: string;
}
```

**Methods:**
- `track(event, properties)` - Track event using gtag
- `identify(userId, traits)` - Set user ID and properties
- `page(name, properties)` - Track page view

---

### Complete Analytics Example

```typescript
import {
  AnalyticsManager,
  createAmplitudeAdapter,
  createSegmentAdapter,
  createGoogleAnalyticsAdapter
} from "@vantage-ai/analytics";

const analytics = new AnalyticsManager();

// Add multiple adapters
analytics.addAdapter(createAmplitudeAdapter({ apiKey: "amp-key" }));
analytics.addAdapter(createSegmentAdapter({ writeKey: "seg-key" }));
analytics.addAdapter(createGoogleAnalyticsAdapter({ measurementId: "G-ID" }));

// Track events across all platforms
analytics.identify("user-123", { plan: "pro" });
analytics.track("feature_used", { feature: "vantage-recommendations" });
analytics.page("Dashboard");

// Privacy compliance
analytics.disable(); // Stop tracking
analytics.enable();  // Resume tracking
```

---

## Internationalization

### `@vantage-ai/i18n`

#### `class I18n`

Internationalization manager with 8 language support.

**Constructor:**
```typescript
import { createI18n } from "@vantage-ai/i18n";

const i18n = createI18n({
  defaultLocale: "en",
  fallbackLocale: "en",
  translations: {
    en: { /* ... */ },
    es: { /* ... */ }
  }
});
```

**Configuration:**
```typescript
interface I18nConfig {
  defaultLocale: Locale;
  fallbackLocale?: Locale;
  translations: Record<Locale, Translation>;
}

type Locale = "en" | "es" | "fr" | "de" | "ja" | "zh" | "pt" | "ar";
```

---

**Methods:**

##### `setLocale(locale: Locale): void`
Change the current locale.

```typescript
i18n.setLocale("es"); // Switch to Spanish
```

##### `getLocale(): Locale`
Get the current locale.

```typescript
const currentLocale = i18n.getLocale(); // "es"
```

##### `t(key: string, params?: Record<string, string>): string`
Translate a key with optional parameter replacement.

```typescript
// Basic translation
const dismiss = i18n.t("widgets.banner.dismiss");
// "Descartar" (if locale is "es")

// With parameters
i18n.addTranslations("en", {
  greeting: "Hello, {name}!"
});

const greeting = i18n.t("greeting", { name: "John" });
// "Hello, John!"
```

**Features:**
- Nested key support (`"widgets.banner.dismiss"`)
- Parameter replacement (`{param}`)
- Fallback to `fallbackLocale` if key not found
- Returns key if translation missing

##### `addTranslations(locale: Locale, translations: Translation): void`
Add or update translations for a locale.

```typescript
i18n.addTranslations("en", {
  custom: {
    message: "Custom message"
  }
});
```

---

### Default Translations

Vantage AI includes default translations for all widgets in 8 languages:

**Supported Languages:**
- 🇺🇸 English (`en`)
- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`)
- 🇩🇪 German (`de`)
- 🇯🇵 Japanese (`ja`)
- 🇨🇳 Chinese (`zh`)
- 🇧🇷 Portuguese (`pt`)
- 🇸🇦 Arabic (`ar`)

**Default Translation Keys:**
```typescript
{
  widgets: {
    banner: {
      dismiss: string;
      learnMore: string;
    },
    tooltip: {
      close: string;
    },
    checklist: {
      completed: string;
      of: string;
    },
    modal: {
      close: string;
    },
    tour: {
      next: string;
      previous: string;
      skip: string;
      finish: string;
      of: string;
    }
  },
  errors: {
    generic: string;
    network: string;
    validation: string;
  }
}
```

---

### Usage with Widgets

```typescript
import { createI18n } from "@vantage-ai/i18n";

const i18n = createI18n({ defaultLocale: "es" });

// Use in your app
const Banner = ({ title, message }) => (
  <div className="banner">
    <h3>{title}</h3>
    <p>{message}</p>
    <button>{i18n.t("widgets.banner.dismiss")}</button>
  </div>
);
```

---

## Developer Tools

### `@vantage-ai/devtools`

#### `class PlaybookValidator`

Validates playbook syntax, security, and best practices.

**Usage:**
```typescript
import { validatePlaybook, PlaybookValidator } from "@vantage-ai/devtools";

// Quick validation
const result = validatePlaybook(playbook);

// Or use class instance
const validator = new PlaybookValidator();
const result = validator.validate(playbook);
```

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}
```

---

**Example:**
```typescript
const result = validatePlaybook({
  id: "test-playbook",
  match: {
    categories: ["friction"],
    routePattern: "/checkout.*",
    minScore: 0.7
  },
  recommendation: {
    id: "help-1",
    title: "Need help?",
    message: "We're here to assist",
    severity: "info"
  }
});

if (!result.valid) {
  console.error("Validation errors:", result.errors);
}

result.warnings.forEach((warning) => {
  console.warn(`${warning.field}: ${warning.message}`);
});
```

---

**Validation Checks:**

1. **Required Fields:**
   - Playbook ID, match conditions, recommendation

2. **Type Safety:**
   - All fields have correct types
   - Categories are valid (`"friction" | "error" | "confusion"`)
   - Severity is valid (`"info" | "warning" | "critical"`)
   - Widget type is valid

3. **Security:**
   - ReDoS protection (regex pattern analysis)
   - No unsafe patterns in `routePattern`

4. **Best Practices:**
   - Priority between 0-100
   - At least one match condition specified
   - minScore between 0-1

---

##### `validateBatch(playbooks: Playbook[]): Record<string, ValidationResult>`

Validate multiple playbooks at once.

```typescript
const results = validator.validateBatch([playbook1, playbook2, playbook3]);

Object.entries(results).forEach(([id, result]) => {
  if (!result.valid) {
    console.error(`Playbook ${id} is invalid:`, result.errors);
  }
});
```

---

#### `class VantageProfiler`

Real-time performance profiler for Vantage AI.

**Usage:**
```typescript
import { VantageProfiler } from "@vantage-ai/devtools";

const profiler = new VantageProfiler();

// Start profiling
profiler.start();

// ... run Vantage AI ...

// Record metrics manually (or integrate with Vantage internals)
profiler.recordDetectorLatency("RageClickDetector", 2.5);
profiler.recordCollectorOverhead("DOMCollector", 1.2);
profiler.recordRecommendationLatency(5.3);
profiler.recordWidgetRenderTime("Banner", 8.7);

// Get performance report
profiler.stop();
const report = profiler.getReport();
console.log(report);
```

---

**Methods:**

##### `start(): void`
Start profiling session. Resets all metrics.

##### `stop(): void`
Stop profiling session. Stops memory tracking.

##### `recordDetectorLatency(detectorName: string, latency: number): void`
Record detector execution time in milliseconds.

##### `recordCollectorOverhead(collectorName: string, overhead: number): void`
Record collector overhead in milliseconds.

##### `recordRecommendationLatency(latency: number): void`
Record recommendation generation time in milliseconds.

##### `recordWidgetRenderTime(widgetType: string, renderTime: number): void`
Record widget render time in milliseconds.

##### `getReport(): PerformanceReport`
Get comprehensive performance report.

**Returns:**
```typescript
interface PerformanceReport {
  detectors: Record<string, MetricSummary>;
  collectors: Record<string, MetricSummary>;
  recommendations: MetricSummary;
  widgets: Record<string, MetricSummary>;
  memory: {
    avg: number;  // MB
    max: number;  // MB
    min: number;  // MB
  };
}

interface MetricSummary {
  avg: number;    // Average
  p50: number;    // Median
  p95: number;    // 95th percentile
  p99: number;    // 99th percentile
  max: number;    // Maximum
  count: number;  // Sample count
}
```

---

**Example Report:**
```typescript
{
  detectors: {
    RageClickDetector: {
      avg: 2.3,
      p50: 2.1,
      p95: 3.8,
      p99: 4.5,
      max: 5.2,
      count: 147
    }
  },
  collectors: {
    DOMCollector: {
      avg: 1.1,
      p50: 1.0,
      p95: 1.8,
      p99: 2.1,
      max: 2.5,
      count: 1523
    }
  },
  recommendations: {
    avg: 4.2,
    p50: 3.9,
    p95: 6.1,
    p99: 7.8,
    max: 9.3,
    count: 23
  },
  widgets: {
    Banner: {
      avg: 7.5,
      p50: 7.2,
      p95: 9.8,
      p99: 11.2,
      max: 12.1,
      count: 15
    }
  },
  memory: {
    avg: 45.2,  // MB
    max: 52.1,
    min: 38.7
  }
}
```

---

## Advanced Features

### `@vantage-ai/sdk/advanced`

#### A/B Testing

##### `class ABTestingEngine`

Create and manage A/B tests with weighted variants.

**Usage:**
```typescript
import { ABTestingEngine } from "@vantage-ai/sdk/advanced/abTesting";

const abTest = new ABTestingEngine();

// Register test
abTest.registerTest({
  id: "checkout-banner",
  name: "Checkout Banner Variants",
  variants: [
    { id: "control", name: "Original", weight: 50 },
    { id: "variant-a", name: "New Design", weight: 30 },
    { id: "variant-b", name: "Minimal", weight: 20 }
  ],
  sticky: true  // Remember user's variant
});

// Get variant for user
const variant = abTest.getVariant("checkout-banner", "user-123");
// Returns: "control", "variant-a", or "variant-b"
```

---

**Types:**
```typescript
interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  sticky?: boolean;
}

interface ABTestVariant {
  id: string;
  name: string;
  weight: number;  // 0-100, must sum to 100
}
```

**Methods:**

##### `registerTest(test: ABTest): void`
Register an A/B test. Validates that weights sum to 100.

##### `getVariant(testId: string, userId?: string): string | null`
Get variant for a user. If `sticky: true`, assignment is persisted in localStorage.

##### `clearAssignments(): void`
Clear all stored variant assignments.

---

**Integration with Playbooks:**
```typescript
const variant = abTest.getVariant("banner-test", userId);

if (variant === "variant-a") {
  // Show variant A recommendation
  vantage.onTrigger((rec) => {
    if (rec.id === "checkout-help") {
      rec.message = "New message for variant A";
    }
  });
}
```

---

#### User Segmentation

##### `class SegmentationEngine`

Segment users based on conditions with AND/OR logic.

**Usage:**
```typescript
import { SegmentationEngine } from "@vantage-ai/sdk/advanced/segmentation";

const segments = new SegmentationEngine();

// Register segment
segments.registerSegment({
  id: "power-users",
  name: "Power Users",
  conditions: [
    { field: "loginCount", operator: "greater_than", value: 50 },
    { field: "plan", operator: "in", value: ["pro", "enterprise"] },
    { field: "lastActive", operator: "greater_than", value: Date.now() - 7 * 24 * 60 * 60 * 1000 }
  ],
  logic: "AND"
});

// Check if user is in segment
const user = {
  loginCount: 75,
  plan: "pro",
  lastActive: Date.now()
};

if (segments.isInSegment("power-users", user)) {
  // Show advanced features
}

// Get all matching segments
const matching = segments.getMatchingSegments(user);
// Returns: ["power-users", "active-users", ...]
```

---

**Types:**
```typescript
interface UserSegment {
  id: string;
  name: string;
  conditions: SegmentCondition[];
  logic?: "AND" | "OR";  // Default: "AND"
}

interface SegmentCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in";
  value: any;
}
```

**Operators:**
- `equals` - Exact match
- `not_equals` - Not equal
- `contains` - String contains
- `greater_than` - Numeric greater than
- `less_than` - Numeric less than
- `in` - Value in array
- `not_in` - Value not in array

**Methods:**

##### `registerSegment(segment: UserSegment): void`
Register a user segment.

##### `isInSegment(segmentId: string, user: Record<string, any>): boolean`
Check if user matches segment conditions.

##### `getMatchingSegments(user: Record<string, any>): string[]`
Get all segments that match the user.

---

**Nested Field Support:**
```typescript
segments.registerSegment({
  id: "premium-cart",
  conditions: [
    { field: "cart.total", operator: "greater_than", value: 100 },
    { field: "cart.items.length", operator: "greater_than", value: 3 }
  ]
});

const user = {
  cart: {
    total: 150,
    items: [1, 2, 3, 4]
  }
};

segments.isInSegment("premium-cart", user); // true
```

---

#### Session Management

##### `class SessionManager`

Track user sessions and journeys with automatic timeout.

**Usage:**
```typescript
import { SessionManager } from "@vantage-ai/sdk/advanced/session";

const sessionManager = new SessionManager((journey) => {
  // Called when session ends
  console.log("Session ended:", journey);

  // Send to analytics
  analytics.track("session_complete", {
    duration: journey.endTime - journey.startTime,
    eventCount: journey.events.length,
    path: journey.events.map(e => e.route).join(" -> ")
  });
});

// Record events
sessionManager.recordEvent({
  type: "page_view",
  route: "/dashboard",
  data: { referrer: "/login" }
});

sessionManager.recordEvent({
  type: "button_click",
  route: "/dashboard",
  data: { button: "create-project" }
});

// Get current session
const session = sessionManager.getCurrentSession();

// Get navigation path
const path = sessionManager.getJourneyPath();
// Returns: ["/login", "/dashboard", "/settings"]

// Get session duration
const duration = sessionManager.getDuration(); // milliseconds
```

---

**Types:**
```typescript
interface Journey {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  events: SessionEvent[];
  metadata: Record<string, any>;
}

interface SessionEvent {
  type: string;
  timestamp: number;
  route: string;
  data: Record<string, any>;
}
```

**Constructor:**
```typescript
new SessionManager(onSessionEnd?: (journey: Journey) => void)
```

**Methods:**

##### `startSession(userId?: string): void`
Start a new session. Called automatically on first event.

##### `recordEvent(event: Omit<SessionEvent, "timestamp">): void`
Record an event in the current session.

##### `endSession(): void`
End the current session. Triggers `onSessionEnd` callback.

##### `getCurrentSession(): Journey | null`
Get the current session object.

##### `getJourneyPath(): string[]`
Get unique navigation path (removes consecutive duplicates).

##### `getDuration(): number`
Get session duration in milliseconds.

---

**Auto-Timeout:**
- Session ends after **30 minutes** of inactivity
- Activity detected from: clicks, keypresses, scrolling, mouse movement
- Session also ends on page unload (`beforeunload` event)

**Metadata Captured:**
```typescript
{
  userAgent: string;
  language: string;
  timezone: string;
}
```

---

### Complete Advanced Example

```typescript
import { ABTestingEngine } from "@vantage-ai/sdk/advanced/abTesting";
import { SegmentationEngine } from "@vantage-ai/sdk/advanced/segmentation";
import { SessionManager } from "@vantage-ai/sdk/advanced/session";
import { initVantage } from "@vantage-ai/sdk";

// Setup A/B testing
const abTest = new ABTestingEngine();
abTest.registerTest({
  id: "onboarding-flow",
  name: "Onboarding Flow Test",
  variants: [
    { id: "control", name: "Original", weight: 50 },
    { id: "streamlined", name: "Streamlined", weight: 50 }
  ],
  sticky: true
});

// Setup segmentation
const segments = new SegmentationEngine();
segments.registerSegment({
  id: "new-users",
  name: "New Users",
  conditions: [
    { field: "signupDate", operator: "greater_than", value: Date.now() - 7 * 24 * 60 * 60 * 1000 }
  ]
});

// Setup session tracking
const sessionManager = new SessionManager((journey) => {
  analytics.track("session_complete", {
    duration: journey.endTime - journey.startTime,
    eventCount: journey.events.length
  });
});

// Initialize Vantage with advanced features
const vantage = initVantage({
  mode: "lite",
  playbooks: [...],
  onTrigger: (rec) => {
    const user = getCurrentUser();
    const variant = abTest.getVariant("onboarding-flow", user.id);

    // Customize based on segment
    if (segments.isInSegment("new-users", user)) {
      // Show beginner-friendly message
      rec.message = "Welcome! " + rec.message;
    }

    // Customize based on A/B test
    if (variant === "streamlined") {
      rec.widget = "toast"; // Use less intrusive widget
    }

    // Record session event
    sessionManager.recordEvent({
      type: "recommendation_shown",
      route: window.location.pathname,
      data: { recommendationId: rec.id }
    });

    showRecommendation(rec);
  }
});

vantage.start();
```

---

## API Summary

### Package Overview

| Package | Purpose | Key Exports |
|---------|---------|-------------|
| `@vantage-ai/sdk` | Core engine | `initVantage`, detectors, collectors, types |
| `@vantage-ai/widgets` | UI components | `Banner`, `Tooltip`, `Checklist`, `Modal`, `Toast`, `ProductTour` |
| `@vantage-ai/react-hooks` | React integration | `useVantage`, `useRecommendation`, `useGuidance`, `usePlaybook`, `useAnalytics` |
| `@vantage-ai/vue` | Vue 3 integration | `useVantage`, `useRecommendation`, `useGuidance`, `usePlaybook` |
| `@vantage-ai/analytics` | Analytics adapters | `AnalyticsManager`, `createAmplitudeAdapter`, `createSegmentAdapter`, `createGoogleAnalyticsAdapter` |
| `@vantage-ai/i18n` | Internationalization | `createI18n`, `I18n`, `defaultTranslations` |
| `@vantage-ai/devtools` | Developer tools | `validatePlaybook`, `PlaybookValidator`, `VantageProfiler` |
| `@vantage-ai/sdk/advanced` | Advanced features | `ABTestingEngine`, `SegmentationEngine`, `SessionManager` |

---

## TypeScript Support

All packages include complete TypeScript definitions:

```typescript
import type {
  Vantage,
  VantageConfig,
  Recommendation,
  SuspicionSignal,
  EventContext,
  Playbook
} from "@vantage-ai/sdk";

import type {
  AnalyticsAdapter,
  AnalyticsManager
} from "@vantage-ai/analytics";

import type {
  I18n,
  Locale,
  Translation
} from "@vantage-ai/i18n";

import type {
  ValidationResult,
  PerformanceReport
} from "@vantage-ai/devtools";

import type {
  ABTest,
  UserSegment,
  Journey
} from "@vantage-ai/sdk/advanced";
```

---

## Additional Resources

- **[Feature Recommendations](./FEATURE_RECOMMENDATIONS.md)** - Roadmap for v4.0+
- **[v3.0 Features Guide](./v3-features.md)** - Complete feature documentation
- **[Migration Guide](./MIGRATION_V3.md)** - Upgrading from v2.0
- **[Security Policy](../SECURITY.md)** - Vulnerability reporting
- **[Examples](../examples/)** - Sample implementations
- **[Contributing](../CONTRIBUTING.md)** - Contribution guidelines

---

**Last Updated:** 2025-01-17
**Version:** 3.0.0
