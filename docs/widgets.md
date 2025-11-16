# Vantage AI Widgets

## Overview

Widgets are UI components that display contextual guidance to users.

## Available Widgets

### Banner

A fixed-position notification at the bottom of the screen.

**Usage with React**:

```typescript
import { Banner } from "@vantage-ai/widgets";

<Banner
  title="Need help?"
  message="We noticed you're having trouble with checkout."
  severity="info"
  link="/help/checkout"
  onClose={() => console.log("Closed")}
/>
```

**Programmatic Usage**:

```typescript
import { createBannerRenderer } from "@vantage-ai/widgets";

const bannerRenderer = createBannerRenderer();

bannerRenderer.show({
  id: "help-1",
  title: "Need help?",
  message: "We noticed you're having trouble.",
  severity: "info",
  link: "/help"
});
```

### Tooltip

*Coming soon* - Contextual tooltips attached to elements.

### Checklist

*Coming soon* - Step-by-step onboarding checklists.

## Styling

### Custom Styles

Widgets accept custom style props:

```typescript
<Banner
  title="Custom Banner"
  message="This uses custom styles"
  style={{
    background: "#1a1a1a",
    borderColor: "#10b981"
  }}
/>
```

### CSS Variables

Override default styles with CSS variables:

```css
:root {
  --vantage-banner-bg: #1a1a1a;
  --vantage-banner-text: #ffffff;
  --vantage-banner-border-info: #2563eb;
  --vantage-banner-border-warning: #f59e0b;
  --vantage-banner-border-critical: #dc2626;
}
```

## Framework Support

### React

Full support with TypeScript types.

### Vue

*Coming soon*

### Svelte

*Coming soon*

### Vanilla JS

Use the programmatic API:

```typescript
import { createBannerRenderer } from "@vantage-ai/widgets";

const renderer = createBannerRenderer();
renderer.show(recommendation);
```

## Accessibility

- Keyboard navigable
- Screen reader compatible
- Focus management
- ARIA labels

## Contributing

We welcome new widget types:

- Modal dialogs
- Toast notifications
- Inline hints
- Video tutorials
- Chatbot integration

See `CONTRIBUTING.md` for details.
