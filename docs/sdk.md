# Vantage AI SDK

## Installation

```bash
npm install @vantage-ai/sdk
# or
pnpm add @vantage-ai/sdk
```

## Basic Usage

```typescript
import { initVantage } from "@vantage-ai/sdk";

const vantage = initVantage({
  mode: "lite",
  playbooks: [...],
  onTrigger: (recommendation) => {
    console.log("Guidance triggered:", recommendation);
  }
});

vantage.start();
```

## Configuration

### `VantageConfig`

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `"lite" \| "ai"` | Operating mode |
| `playbooks` | `Playbook[]` | Array of playbook rules |
| `onTrigger` | `(rec: Recommendation) => void` | Callback when guidance is triggered |

## Core Concepts

### Event Context

Every interaction generates an `EventContext`:

```typescript
interface EventContext {
  route: string;        // Current page route
  timestamp: number;    // When event occurred
  eventType: string;    // Type of event (click, dom-error, etc.)
  details: Record<string, unknown>;  // Event-specific data
}
```

### Suspicion Signals

Detectors generate `SuspicionSignal` objects:

```typescript
interface SuspicionSignal {
  id: string;
  score: number;  // 0-1 confidence
  category: "friction" | "error" | "confusion";
  context: EventContext[];
}
```

### Recommendations

When a playbook matches, a `Recommendation` is generated:

```typescript
interface Recommendation {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  link?: string;
  widget?: "banner" | "tooltip" | "checklist";
}
```

## Detectors

### Rage Click Detector

Triggers when user clicks rapidly (5+ times in 5 seconds).

### Form Failure Detector

*Coming soon* - Detects repeated form submissions with validation errors.

### Navigation Loop Detector

*Coming soon* - Detects back/forward navigation patterns.

## Extending

### Custom Detector

```typescript
import type { EventContext, SuspicionSignal } from "@vantage-ai/sdk";

class MyCustomDetector {
  detect(ctx: EventContext): SuspicionSignal | null {
    // Your logic here
    return null;
  }
}
```

### Custom Collector

```typescript
import type { EventContext } from "@vantage-ai/sdk";

class MyCustomCollector {
  start(callback: (ctx: EventContext) => void) {
    // Set up listeners
    // Call callback with events
  }
}
```
