# Vantage AI Playbooks

## Overview

Playbooks are JSON/YAML configurations that map behavioral patterns to user guidance.

## Structure

```typescript
interface Playbook {
  id: string;
  description?: string;
  match: PlaybookMatchCondition;
  recommendation: Recommendation;
}
```

## Match Conditions

### Categories

```typescript
{
  match: {
    categories: ["friction", "error", "confusion"]
  }
}
```

### Score Threshold

```typescript
{
  match: {
    minScore: 0.6  // 0-1 confidence
  }
}
```

### Route Pattern

```typescript
{
  match: {
    routePattern: "checkout|payment|billing"
  }
}
```

### Text Contains

```typescript
{
  match: {
    containsText: ["error", "failed", "invalid"]
  }
}
```

## Examples

### Rage Click on Checkout

```typescript
{
  id: "rage-click-checkout",
  description: "User stuck on checkout",
  match: {
    categories: ["friction"],
    minScore: 0.4,
    routePattern: "checkout|payment"
  },
  recommendation: {
    id: "checkout-help",
    title: "Having trouble?",
    message: "Try refreshing or contact support if the issue persists.",
    severity: "info",
    link: "/help/checkout",
    widget: "banner"
  }
}
```

### API Error with Confusion

```typescript
{
  id: "api-error-confusion",
  description: "User seeing API errors",
  match: {
    categories: ["error", "confusion"],
    containsText: ["500", "failed"]
  },
  recommendation: {
    id: "api-error-help",
    title: "Something went wrong",
    message: "We're experiencing technical issues. Please try again in a moment.",
    severity: "warning",
    widget: "banner"
  }
}
```

### Onboarding Abandonment

```typescript
{
  id: "onboarding-abandonment",
  description: "User stuck in onboarding",
  match: {
    categories: ["confusion"],
    routePattern: "onboarding|setup",
    minScore: 0.3
  },
  recommendation: {
    id: "onboarding-help",
    title: "Need a quick tour?",
    message: "Let us show you around in 2 minutes.",
    severity: "info",
    link: "/tour",
    widget: "banner"
  }
}
```

## Best Practices

1. **Be Specific**: Use route patterns to target specific flows
2. **Adjust Thresholds**: Tune `minScore` to avoid false positives
3. **Helpful Messages**: Focus on solutions, not just problems
4. **Test Thoroughly**: Verify playbooks with real user behavior
5. **Version Control**: Track playbook changes in git

## Dynamic Playbooks

Load playbooks from your backend:

```typescript
const playbooks = await fetch("/api/vantage/playbooks").then(r => r.json());

initVantage({
  mode: "lite",
  playbooks,
  onTrigger: (rec) => { ... }
});
```

## Community Playbooks

We maintain a library of common playbooks:

- E-commerce checkout
- SaaS onboarding
- Form validation
- Authentication flows

See `packages/vantage-playbooks/src/` for examples.

## Contributing

Share your playbooks with the community! See `CONTRIBUTING.md`.
