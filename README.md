# Vantage AI v7.0

### 🚀 **AI-Powered Analytics Platform with Complete Framework Coverage**

**The only open-source UX intelligence platform with AI insights, session replay, mobile SDK, cohort analysis, custom dashboards, advanced A/B testing, and real-time collaboration.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📖 Table of Contents

- [What is Vantage AI?](#what-is-vantage-ai)
- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [All Packages](#all-packages)
- [Framework Support](#framework-support)
- [Complete Feature List](#complete-feature-list)
- [Version History](#version-history)
- [Architecture](#architecture)
- [Use Cases](#use-cases)
- [Documentation](#documentation)
- [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 What is Vantage AI?

**Vantage AI** is a production-ready, enterprise-grade analytics and UX intelligence platform that runs entirely in the browser. It helps you understand user behavior, detect friction points, and improve conversions through:

- **Real-time behavioral detection** - 8 algorithms detect rage clicks, form failures, navigation loops, etc.
- **AI-powered insights** - Automatic anomaly detection, trend analysis, and forecasting
- **Session replay** - Privacy-first recording with PII filtering
- **Heatmaps** - 5 types (Click, Scroll, Attention, Rage, Dead)
- **Mobile SDK** - React Native with touch tracking
- **Cohort analysis** - RFM segmentation with 11 segments
- **Custom dashboards** - 7 widget types with real-time updates
- **Advanced A/B testing** - Multivariate with statistical significance
- **Real-time collaboration** - WebSocket-based dashboard sharing

All with **zero server-side dependencies**, **privacy-first architecture**, and **complete framework coverage**.

---

## ✨ Key Features

### 🤖 **AI-Powered Intelligence (v7.0)**
- **Anomaly Detection** - Z-score, IQR, and trend change detection
- **Trend Analysis** - R² confidence levels and period comparisons
- **Forecasting** - Linear and moving average predictions
- **Automated Insights** - Natural language summaries
- **Severity Classification** - Critical, high, medium, low

### 🌐 **Framework-Agnostic Web Components (v7.0)**
- **Custom Elements** - Work in any framework
- **Shadow DOM** - Encapsulated styling
- **4 Components** - Metric cards, banners, charts, recommendations
- **Zero Dependencies** - Pure Web Components

### 🧪 **Advanced A/B Testing (v7.0)**
- **Multivariate Testing** - Test multiple variables
- **Statistical Significance** - P-values and confidence intervals
- **Automatic Winner Detection** - AI-powered selection
- **Sample Size Tracking** - Ensure statistical validity

### 🔴 **Real-time Collaboration (v7.0)**
- **WebSocket Integration** - Live dashboard updates
- **Cursor Tracking** - See where others are looking
- **Presence Awareness** - Know who's online
- **Room-based Collaboration** - Isolated workspaces

### 🎯 **Complete Framework Coverage (v1.0-v6.0)**
- **React** - Hooks (useVantage, useVantageMobile)
- **Vue 3** - Composables with reactive state
- **Svelte** - 5 reactive stores
- **Angular** - Services, directives, pipes with RxJS
- **React Native** - Mobile SDK with session replay
- **Vanilla JS** - Core SDK for any framework

### 📱 **Mobile SDK (v6.0)**
- **Session Tracking** - Screen views and navigation
- **Touch Heatmaps** - Tap, swipe, long-press tracking
- **Crash Reporting** - Automatic error capture
- **Device Info** - Platform, OS, screen dimensions
- **App State Monitoring** - Background/foreground
- **Privacy Controls** - Configurable sampling

### 👥 **Cohort Analysis (v6.0)**
- **4 Cohort Types** - Acquisition, Behavioral, Demographic, RFM
- **Retention Tracking** - Daily, weekly, monthly curves
- **RFM Segmentation** - 11 segments (Champions, Loyal, At Risk, etc.)
- **Metrics** - Total users, active users, churn rate, LTV
- **Comparison** - Side-by-side cohort analysis
- **CSV Export** - Data portability

### 📊 **Custom Dashboards (v6.0)**
- **7 Widget Types** - Metrics, Line/Bar/Pie/Area charts, Tables, Funnels
- **Grid Layout** - Flexible positioning
- **Auto-Refresh** - Configurable intervals
- **SVG Charts** - Lightweight, responsive
- **Value Formatting** - Number, %, currency, duration
- **Async Data** - Load from any source

### 📋 **User Feedback (v5.0)**
- **Survey Widget** - 5 question types (Rating, NPS, Multiple Choice, Text, Yes/No)
- **FeedbackButton** - Floating collection widget
- **Validation** - Required fields
- **Progress Tracking** - Multi-step surveys
- **Customizable** - Colors, positions, labels

### 🎬 **Session Replay (v4.0)**
- **DOM Recording** - Snapshot and mutations
- **Privacy-First** - Automatic PII filtering
- **3 Privacy Levels** - Strict, balanced, permissive
- **Password Masking** - Always redacted
- **Playback** - Speed control, timeline scrubbing
- **Export** - JSON format

### 🔥 **Heatmaps (v4.0)**
- **Click Heatmap** - Where users click
- **Scroll Heatmap** - Depth visualization
- **Attention Heatmap** - Hover and pause areas
- **Rage Click Heatmap** - Frustration detection
- **Dead Click Heatmap** - Non-interactive clicks
- **3 Color Schemes** - Hot, cool, rainbow
- **Export/Import** - JSON data

### 📈 **Funnel Analysis (v4.0)**
- **Multi-step Tracking** - Conversion funnels
- **Drop-off Analysis** - Per-step metrics
- **Time-to-Convert** - Duration tracking
- **Visual Renderer** - Progress bars
- **Conversion Window** - Configurable timeout

### 🚩 **Feature Flags (v4.0)**
- **Percentage Rollout** - 0-100% gradual release
- **User Targeting** - Segment-based
- **Whitelist** - Specific user IDs
- **Environment Flags** - Production, staging, dev
- **Time-limited** - Start/end dates
- **Local Overrides** - Testing support

### 📊 **Analytics Integrations (v3.0-v4.0)**
- **Amplitude** - Product analytics
- **Segment** - Customer data platform
- **Google Analytics 4** - Web analytics
- **Mixpanel** - Event tracking
- **Heap** - Auto-capture
- **PostHog** - Open-source analytics

### 🎨 **Widgets (v1.0-v5.0)**
- **Banner** - Top notifications
- **Tooltip** - Contextual help
- **Checklist** - Onboarding tasks
- **Modal** - Full-screen guidance
- **Toast** - Quick notifications
- **Product Tour** - Multi-step walkthrough
- **Survey** - User feedback
- **FeedbackButton** - Floating collection

### 🔍 **Detection Algorithms (v2.0-v3.0)**
- **Rage Clicks** - 5+ rapid clicks
- **Form Failures** - Submission errors
- **Navigation Loops** - Repeated page visits
- **Hover Confusion** - Extended hover without action
- **Scroll Abandonment** - Incomplete scrolling
- **Time on Page** - Session duration tracking
- **Dead Clicks** - Non-interactive elements
- **Error Detection** - JavaScript errors

### 🌍 **Internationalization (v3.0)**
- **8 Languages** - English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese
- **Easy Extension** - Add custom translations
- **Auto-detection** - Browser language

### 🛠️ **Developer Tools (v3.0)**
- **Playbook Validator** - JSON schema validation
- **Performance Profiler** - Execution timing
- **Debug Mode** - Detailed logging
- **TypeScript** - Full type safety

### 🔒 **Security (v2.0-v4.0)**
- **XSS Protection** - HTML sanitization
- **PII Filtering** - Emails, phones, SSNs, credit cards
- **Rate Limiting** - Prevent abuse
- **CSP Compliant** - Content Security Policy
- **GDPR/CCPA Ready** - Privacy compliance

---

## 🚀 Quick Start

### React Application

```bash
npm install @vantage-ai/sdk @vantage-ai/react-hooks @vantage-ai/widgets
```

```tsx
import { useVantage } from "@vantage-ai/react-hooks";
import { Banner, Survey } from "@vantage-ai/widgets";
import playbooks from "@vantage-ai/playbooks";

function App() {
  const { start, recommendations } = useVantage({
    mode: "lite",
    playbooks,
    onTrigger: (rec) => console.log("Triggered:", rec)
  });

  useEffect(() => {
    start();
  }, [start]);

  return (
    <div>
      {recommendations.map((rec) => (
        <Banner key={rec.id} {...rec} />
      ))}
    </div>
  );
}
```

### Vue 3 Application

```bash
npm install @vantage-ai/sdk @vantage-ai/vue
```

```vue
<script setup>
import { useVantage } from "@vantage-ai/vue";
import playbooks from "@vantage-ai/playbooks";

const { recommendations, start } = useVantage({
  mode: "lite",
  playbooks
});

onMounted(() => start());
</script>

<template>
  <div v-for="rec in recommendations" :key="rec.id">
    {{ rec.message }}
  </div>
</template>
```

### Svelte Application

```bash
npm install @vantage-ai/sdk @vantage-ai/svelte
```

```svelte
<script>
  import { createVantageStore } from '@vantage-ai/svelte';
  import playbooks from '@vantage-ai/playbooks';

  const vantageStore = createVantageStore({ mode: 'lite', playbooks });
  const { recommendations, start } = vantageStore;

  onMount(() => start());
</script>

{#each $recommendations as rec (rec.id)}
  <div>{rec.message}</div>
{/each}
```

### Angular Application

```bash
npm install @vantage-ai/sdk @vantage-ai/angular
```

```typescript
// app.module.ts
import { VantageModule } from '@vantage-ai/angular';
import playbooks from '@vantage-ai/playbooks';

@NgModule({
  imports: [
    VantageModule.forRoot({
      mode: 'lite',
      playbooks
    })
  ]
})
export class AppModule {}

// component.ts
import { VantageService } from '@vantage-ai/angular';

@Component({
  selector: 'app-dashboard',
  template: `
    <div *ngFor="let rec of recommendations$ | async">
      {{ rec.message }}
    </div>
  `
})
export class DashboardComponent implements OnInit {
  recommendations$ = this.vantageService.recommendations$;

  constructor(private vantageService: VantageService) {}

  ngOnInit() {
    this.vantageService.start();
  }
}
```

### React Native Application

```bash
npm install @vantage-ai/sdk @vantage-ai/react-native
```

```tsx
import { useVantageMobile } from '@vantage-ai/react-native';
import { useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

function App() {
  const { trackScreen, trackTouch, start, isActive } = useVantageMobile({
    sessionReplaySampleRate: 1.0,
    enableTouchHeatmaps: true,
    enableCrashReporting: true
  });

  useEffect(() => {
    start();
    trackScreen('HomeScreen');
  }, []);

  return (
    <View>
      <TouchableOpacity onPress={(e) => trackTouch(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
        <Text>Track This!</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Web Components (Framework-Agnostic)

```bash
npm install @vantage-ai/web-components
```

```html
<!-- Works in ANY framework or vanilla HTML -->
<script type="module">
  import '@vantage-ai/web-components';
</script>

<!-- Metric Card -->
<vantage-metric-card
  label="Active Users"
  value="15234"
  change="12.5"
  trend="up"
  format="number">
</vantage-metric-card>

<!-- Banner -->
<vantage-banner
  title="Welcome!"
  message="Get started with Vantage AI"
  type="success"
  dismissible>
</vantage-banner>

<!-- Chart -->
<vantage-chart
  type="line"
  data="[12, 19, 3, 5, 2, 3]"
  labels='["Jan", "Feb", "Mar", "Apr", "May", "Jun"]'>
</vantage-chart>
```

### AI Insights

```typescript
import { InsightGenerator } from '@vantage-ai/ai-insights';

const generator = new InsightGenerator(5); // sensitivity 1-10

const data = [
  { timestamp: Date.now() - 86400000, value: 1000 },
  { timestamp: Date.now() - 43200000, value: 1200 },
  { timestamp: Date.now(), value: 5000 } // Anomaly!
];

const insights = generator.generateInsights(data);
console.log(insights);
// [
//   {
//     type: "anomaly",
//     title: "Spike Detected",
//     severity: "critical",
//     confidence: 0.9,
//     suggestedAction: "Investigate what caused this spike..."
//   }
// ]

const summary = generator.generateSummary(data);
console.log(summary);
// "Current value: 5000.00. up 316.7% from previous period. ⚠️ 1 critical anomaly detected."
```

### Cohort Analysis

```typescript
import { CohortManager, createBehavioralCohort } from '@vantage-ai/cohorts';

const cohortManager = new CohortManager();

// Create cohort
const activeCohort = createBehavioralCohort(
  'active-users',
  'Active Users',
  [
    { event: 'page_view', count: 10 },
    { event: 'purchase', count: 1 }
  ]
);

cohortManager.registerCohort(activeCohort);

// Add users
cohortManager.addUser({
  id: 'user-123',
  joinedAt: Date.now(),
  lastSeenAt: Date.now(),
  properties: {},
  events: [
    { name: 'page_view', timestamp: Date.now() },
    { name: 'purchase', timestamp: Date.now() }
  ]
});

// Get metrics with retention
const metrics = cohortManager.getCohortMetrics('active-users', {
  retentionPeriodType: 'weekly',
  periods: 12
});

console.log(`Total Users: ${metrics.totalUsers}`);
console.log(`Churn Rate: ${metrics.churnRate.toFixed(2)}%`);
console.log(`Week 1 Retention: ${metrics.retentionByPeriod[0].retentionRate.toFixed(1)}%`);

// RFM Analysis
const rfmSegments = cohortManager.getRFMSegments();
rfmSegments.forEach(segment => {
  console.log(`${segment.segment}: ${segment.users.length} users`);
});
```

### Custom Dashboards

```tsx
import { Dashboard } from '@vantage-ai/dashboards';

const config = {
  id: 'analytics-dashboard',
  title: 'Product Analytics',
  refreshInterval: 60000, // 1 minute
  widgets: [
    {
      id: 'active-users',
      type: 'metric',
      title: 'Active Users',
      position: { row: 0, col: 0, width: 3, height: 1 },
      dataSource: async () => ({
        label: 'Active Users',
        value: 15234,
        change: 12.5,
        trend: 'up',
        format: 'number'
      })
    },
    {
      id: 'user-trend',
      type: 'line-chart',
      title: 'User Growth',
      position: { row: 1, col: 0, width: 6, height: 2 },
      dataSource: async () => ({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Users',
          data: [1200, 1350, 1420, 1500, 1523]
        }]
      })
    }
  ]
};

function AnalyticsDashboard() {
  return <Dashboard config={config} onRefresh={() => console.log('Refreshed')} />;
}
```

### A/B Testing

```typescript
import { ExperimentEngine } from '@vantage-ai/ab-testing';

const engine = new ExperimentEngine();

const experiment = {
  id: 'checkout-flow',
  name: 'Checkout Flow Redesign',
  type: 'ab',
  metric: 'conversion_rate',
  status: 'running',
  confidenceLevel: 0.95,
  minSampleSize: 1000,
  variants: [
    { id: 'control', name: 'Original', traffic: 50, conversions: 450, impressions: 10000, value: 0 },
    { id: 'variant', name: 'New Design', traffic: 50, conversions: 520, impressions: 10000, value: 0 }
  ]
};

const results = engine.calculateStatistics(experiment);

console.log(`Winner: ${results.winner}`); // "variant"
console.log(`P-Value: ${results.pValue.toFixed(4)}`);
console.log(`Significant: ${results.significant}`);
console.log(`Sample Size Reached: ${results.sampleSizeReached}`);

results.variants.forEach(v => {
  console.log(`${v.id}: ${(v.conversionRate * 100).toFixed(2)}% (${v.improvement > 0 ? '+' : ''}${v.improvement.toFixed(1)}%)`);
});
```

### Real-time Collaboration

```typescript
import { RealtimeClient } from '@vantage-ai/realtime';

const client = new RealtimeClient({
  url: 'wss://your-server.com/ws',
  roomId: 'dashboard-123',
  userId: 'user-456',
  userName: 'Alice'
});

client.on('connected', () => {
  console.log('Connected to collaboration room');
});

client.on('cursor', (message) => {
  console.log(`User ${message.userId} moved to ${message.data.x}, ${message.data.y}`);
});

client.connect();

// Send cursor position
document.addEventListener('mousemove', (e) => {
  client.sendCursor(e.clientX, e.clientY);
});
```

---

## 📦 All Packages

### Core Packages (v1.0-v3.0)
| Package | Version | Size | Description |
|---------|---------|------|-------------|
| `@vantage-ai/sdk` | 7.0.0 | 45KB | Core SDK with 8 detectors, 3 collectors, security |
| `@vantage-ai/widgets` | 7.0.0 | 32KB | 8 React widgets (Banner, Tooltip, Modal, Survey, etc.) |
| `@vantage-ai/playbooks` | 7.0.0 | 8KB | Default playbooks and configurations |
| `@vantage-ai/engine` | 7.0.0 | 12KB | AI/ML engine for recommendations |

### Framework Integrations (v3.0, v5.0, v6.0)
| Package | Version | Framework | Description |
|---------|---------|-----------|-------------|
| `@vantage-ai/react-hooks` | 7.0.0 | React | useVantage, useRecommendations, usePlaybook |
| `@vantage-ai/vue` | 7.0.0 | Vue 3 | Composables with reactive state |
| `@vantage-ai/svelte` | 7.0.0 | Svelte | 5 reactive stores (VantageStore, etc.) |
| `@vantage-ai/angular` | 7.0.0 | Angular | Services, directives, pipes with RxJS |
| `@vantage-ai/react-native` | 7.0.0 | React Native | Mobile SDK with session replay |

### Analytics & Intelligence (v3.0-v7.0)
| Package | Version | Description |
|---------|---------|-------------|
| `@vantage-ai/analytics` | 7.0.0 | 6 platform integrations (Amplitude, Segment, GA4, Mixpanel, Heap, PostHog) |
| `@vantage-ai/session-replay` | 7.0.0 | Privacy-first session recording with PII filtering |
| `@vantage-ai/heatmaps` | 7.0.0 | 5 heatmap types with canvas rendering |
| `@vantage-ai/funnels` | 7.0.0 | Conversion funnel analysis |
| `@vantage-ai/cohorts` | 7.0.0 | Cohort analysis with RFM segmentation |
| `@vantage-ai/dashboards` | 7.0.0 | Custom analytics dashboards |
| `@vantage-ai/ai-insights` | 7.0.0 | Anomaly detection, trends, forecasting |

### Advanced Features (v4.0-v7.0)
| Package | Version | Description |
|---------|---------|-------------|
| `@vantage-ai/web-components` | 7.0.0 | Framework-agnostic custom elements |
| `@vantage-ai/ab-testing` | 7.0.0 | Multivariate testing with statistical significance |
| `@vantage-ai/realtime` | 7.0.0 | WebSocket-based collaboration |

### Developer Tools (v3.0)
| Package | Version | Description |
|---------|---------|-------------|
| `@vantage-ai/i18n` | 7.0.0 | Internationalization (8 languages) |
| `@vantage-ai/devtools` | 7.0.0 | Playbook validator, performance profiler |

**Total: 20 packages** | **Combined size: ~150KB minified+gzipped**

---

## 🎨 Framework Support

| Framework | Package | Features | Status |
|-----------|---------|----------|--------|
| **React** | `@vantage-ai/react-hooks` | useVantage, useVantageMobile, 8 widgets | ✅ Full Support |
| **Vue 3** | `@vantage-ai/vue` | Composables, reactive state | ✅ Full Support |
| **Svelte** | `@vantage-ai/svelte` | 5 reactive stores | ✅ Full Support |
| **Angular** | `@vantage-ai/angular` | Services, directives, pipes | ✅ Full Support |
| **React Native** | `@vantage-ai/react-native` | Mobile SDK, session replay | ✅ Full Support |
| **Web Components** | `@vantage-ai/web-components` | Custom elements | ✅ Full Support |
| **Vanilla JS** | `@vantage-ai/sdk` | Core SDK | ✅ Full Support |

---

## 🗂️ Complete Feature List

### Detection & Analysis
- ✅ Rage Click Detection (5+ rapid clicks)
- ✅ Form Failure Detection
- ✅ Navigation Loop Detection
- ✅ Hover Confusion Detection
- ✅ Scroll Abandonment Detection
- ✅ Time on Page Tracking
- ✅ Dead Click Detection
- ✅ JavaScript Error Detection
- ✅ Anomaly Detection (Z-score, IQR)
- ✅ Trend Analysis (R² confidence)
- ✅ Forecasting (Linear, Moving Average)

### Session & Replay
- ✅ Session Replay with DOM snapshots
- ✅ PII Filtering (emails, phones, SSNs, credit cards)
- ✅ 3 Privacy Levels (strict, balanced, permissive)
- ✅ Password Masking
- ✅ Playback Controls (speed, seek)
- ✅ JSON Export

### Heatmaps & Visualization
- ✅ Click Heatmap
- ✅ Scroll Heatmap
- ✅ Attention Heatmap
- ✅ Rage Click Heatmap
- ✅ Dead Click Heatmap
- ✅ 3 Color Schemes
- ✅ Export/Import

### Mobile Analytics
- ✅ Session Tracking
- ✅ Screen View Tracking
- ✅ Touch Heatmaps (tap, swipe, long-press)
- ✅ Crash Reporting
- ✅ Device Info Collection
- ✅ App State Monitoring
- ✅ Privacy Controls

### Cohorts & Segmentation
- ✅ Acquisition Cohorts
- ✅ Behavioral Cohorts
- ✅ Demographic Cohorts
- ✅ RFM Segmentation (11 segments)
- ✅ Retention Tracking (daily/weekly/monthly)
- ✅ Churn Analysis
- ✅ LTV Calculation
- ✅ Cohort Comparison
- ✅ CSV Export

### Dashboards & Widgets
- ✅ Metric Cards
- ✅ Line Charts
- ✅ Bar Charts
- ✅ Pie Charts
- ✅ Area Charts
- ✅ Data Tables
- ✅ Funnel Visualizations
- ✅ Auto-Refresh
- ✅ Grid Layout
- ✅ Async Data Sources

### User Feedback
- ✅ Survey Widget (5 question types)
- ✅ NPS Surveys
- ✅ Rating Scales
- ✅ Multiple Choice
- ✅ Text Input
- ✅ Yes/No Questions
- ✅ FeedbackButton Widget
- ✅ Progress Tracking
- ✅ Validation

### Experimentation
- ✅ A/B Testing
- ✅ Multivariate Testing
- ✅ Statistical Significance
- ✅ P-Value Calculation
- ✅ Confidence Intervals
- ✅ Winner Detection
- ✅ Sample Size Tracking

### Analytics Integrations
- ✅ Amplitude
- ✅ Segment
- ✅ Google Analytics 4
- ✅ Mixpanel
- ✅ Heap
- ✅ PostHog

### Guidance Widgets
- ✅ Banner
- ✅ Tooltip
- ✅ Checklist
- ✅ Modal
- ✅ Toast
- ✅ Product Tour
- ✅ Survey
- ✅ FeedbackButton

### Developer Experience
- ✅ TypeScript Support
- ✅ React Hooks
- ✅ Vue Composables
- ✅ Svelte Stores
- ✅ Angular Services
- ✅ Web Components
- ✅ Playbook Validator
- ✅ Performance Profiler
- ✅ Debug Mode

### Internationalization
- ✅ English
- ✅ Spanish
- ✅ French
- ✅ German
- ✅ Italian
- ✅ Portuguese
- ✅ Chinese
- ✅ Japanese

### Security & Privacy
- ✅ XSS Protection
- ✅ PII Filtering
- ✅ Rate Limiting
- ✅ CSP Compliant
- ✅ GDPR Ready
- ✅ CCPA Ready
- ✅ Password Masking
- ✅ Client-side Processing

### Collaboration
- ✅ Real-time Updates (WebSocket)
- ✅ Cursor Tracking
- ✅ Presence Awareness
- ✅ Room-based Collaboration

---

## 📚 Version History

### v7.0 (2025-01-17) - AI Intelligence & Collaboration
**1,800+ lines added**
- 🤖 AI-Powered Insights (anomaly detection, trends, forecasting)
- 🌐 Web Components (framework-agnostic)
- 🧪 Advanced A/B Testing (multivariate, statistical)
- 🔴 Real-time Collaboration (WebSocket)

### v6.0 (2025-01-17) - Enterprise Analytics
**2,400+ lines added**
- 🅰️ Angular Support (services, directives, pipes)
- 📱 React Native SDK (mobile analytics)
- 👥 Cohort Analysis (RFM segmentation)
- 📊 Custom Dashboards (7 widget types)

### v5.0 (2025-01-17) - User Feedback
**700+ lines added**
- 📋 Survey Widget (5 question types)
- 💬 FeedbackButton Widget
- ⚛️ Svelte Support (5 stores)

### v4.0 (2025-01-17) - UX Intelligence
**2,500+ lines added**
- 🎬 Session Replay (privacy-first)
- 🔥 Heatmaps (5 types)
- 📊 Funnel Analysis
- 🚩 Feature Flags
- 📈 Enhanced Analytics (6 platforms)

### v3.0 (2025-01-17) - Framework Support
**3,000+ lines added**
- ⚛️ React Hooks
- 🖖 Vue 3 Composables
- 📊 Analytics Integrations (Amplitude, Segment, GA4)
- 🌍 i18n (8 languages)
- 🧪 A/B Testing
- 👥 User Segmentation
- 📅 Session Management
- 🛠️ Developer Tools
- 🎨 2 New Widgets (Toast, Product Tour)

### v2.0 (2025-01-17) - Security & Performance
**2,000+ lines added**
- 🔒 7 Security Detectors
- 📊 3 Data Collectors
- ⚡ Performance Utilities
- 🎨 4 Widgets (Banner, Tooltip, Checklist, Modal)

### v1.0 (2025-01-17) - Initial Release
**1,000+ lines**
- 🎯 Core SDK
- 🔍 Basic Detection
- 🎨 Banner Widget
- 📖 Playbook System

**Total Across All Versions: 12,400+ lines of production code**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vantage AI v7.0                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Frontend Layer (Framework Agnostic)                   │   │
│  │  ┌──────────┬──────────┬──────────┬──────────────┐    │   │
│  │  │  React   │   Vue    │  Svelte  │   Angular    │    │   │
│  │  │  Hooks   │  Compos. │  Stores  │  Services    │    │   │
│  │  └──────────┴──────────┴──────────┴──────────────┘    │   │
│  │  ┌──────────────────┬───────────────────────────┐     │   │
│  │  │  React Native    │  Web Components           │     │   │
│  │  │  Mobile SDK      │  Custom Elements          │     │   │
│  │  └──────────────────┴───────────────────────────┘     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Core SDK                                              │   │
│  │  ┌──────────────────┬──────────────────────────────┐  │   │
│  │  │  8 Detectors     │  3 Collectors                │  │   │
│  │  │  - Rage Clicks   │  - Network (fetch/XHR)       │  │   │
│  │  │  - Form Failures │  - Errors (global handlers)  │  │   │
│  │  │  - Nav Loops     │  - Performance (Core Vitals) │  │   │
│  │  │  - Hover Conf.   └──────────────────────────────┘  │   │
│  │  │  - Scroll Aband. ┌──────────────────────────────┐  │   │
│  │  │  - Time on Page  │  Advanced Features           │  │   │
│  │  │  - Dead Clicks   │  - A/B Testing               │  │   │
│  │  │  - Errors        │  - Segmentation              │  │   │
│  │  └──────────────────┘  - Session Management        │  │   │
│  │                        - Feature Flags              │  │   │
│  │  ┌──────────────────┐  └──────────────────────────────┘  │   │
│  │  │  Security Layer  │                                    │   │
│  │  │  - XSS Filter    │  ┌──────────────────────────────┐  │   │
│  │  │  - PII Filter    │  │  Performance Utilities       │  │   │
│  │  │  - Rate Limiting │  │  - Debounce/Throttle         │  │   │
│  │  │  - CSP Compliant │  │  - Lazy Loading              │  │   │
│  │  └──────────────────┘  │  - Deduplication             │  │   │
│  │                        └──────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Intelligence Layer                                    │   │
│  │  ┌──────────────────┬──────────────────────────────┐  │   │
│  │  │  AI Insights     │  Session Replay              │  │   │
│  │  │  - Anomaly Det.  │  - DOM Recording             │  │   │
│  │  │  - Trends        │  - PII Filtering             │  │   │
│  │  │  - Forecasting   │  - Privacy Levels            │  │   │
│  │  └──────────────────┴──────────────────────────────┘  │   │
│  │  ┌──────────────────┬──────────────────────────────┐  │   │
│  │  │  Heatmaps (5)    │  Cohort Analysis             │  │   │
│  │  │  - Click         │  - 4 Cohort Types            │  │   │
│  │  │  - Scroll        │  - RFM (11 segments)         │  │   │
│  │  │  - Attention     │  - Retention Tracking        │  │   │
│  │  │  - Rage          │  - Churn Analysis            │  │   │
│  │  │  - Dead          └──────────────────────────────┘  │   │
│  │  └──────────────────┘                                 │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Widgets & Visualization                               │   │
│  │  ┌──────────────────┬──────────────────────────────┐  │   │
│  │  │  8 Widgets       │  Dashboards (7 types)        │  │   │
│  │  │  - Banner        │  - Metrics                   │  │   │
│  │  │  - Tooltip       │  - Line/Bar/Pie/Area Charts  │  │   │
│  │  │  - Checklist     │  - Tables                    │  │   │
│  │  │  - Modal         │  - Funnels                   │  │   │
│  │  │  - Toast         └──────────────────────────────┘  │   │
│  │  │  - ProductTour   ┌──────────────────────────────┐  │   │
│  │  │  - Survey        │  Web Components              │  │   │
│  │  │  - Feedback      │  - vantage-metric-card       │  │   │
│  │  └──────────────────┘  - vantage-banner             │  │   │
│  │                        - vantage-chart               │  │   │
│  │                        - vantage-recommendation      │  │   │
│  │                        └──────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Integrations                                          │   │
│  │  ┌──────────────────┬──────────────────────────────┐  │   │
│  │  │  Analytics (6)   │  Collaboration               │  │   │
│  │  │  - Amplitude     │  - WebSocket                 │  │   │
│  │  │  - Segment       │  - Cursor Tracking           │  │   │
│  │  │  - GA4           │  - Presence                  │  │   │
│  │  │  - Mixpanel      │  - Real-time Updates         │  │   │
│  │  │  - Heap          └──────────────────────────────┘  │   │
│  │  │  - PostHog                                          │  │   │
│  │  └──────────────────┘                                 │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 Use Cases

### E-Commerce
- ✅ Cart abandonment detection
- ✅ Checkout funnel analysis
- ✅ Product page heatmaps
- ✅ User cohort segmentation
- ✅ A/B test pricing strategies

### SaaS Products
- ✅ Onboarding flow optimization
- ✅ Feature adoption tracking
- ✅ Churn prediction (RFM)
- ✅ User feedback collection
- ✅ Trial-to-paid conversion

### Content Platforms
- ✅ Reading behavior analysis
- ✅ Scroll depth tracking
- ✅ Engagement heatmaps
- ✅ Content performance dashboards
- ✅ User retention cohorts

### Mobile Apps
- ✅ Touch heatmaps
- ✅ Screen flow analysis
- ✅ Crash reporting
- ✅ Session replay
- ✅ App state monitoring

### Enterprise Dashboards
- ✅ Real-time collaboration
- ✅ Custom visualizations
- ✅ Anomaly alerts
- ✅ Trend forecasting
- ✅ Team analytics

---

## 📖 Documentation

### Getting Started
- [Installation Guide](./docs/installation.md)
- [Quick Start Tutorial](./docs/quick-start.md)
- [Configuration](./docs/configuration.md)

### Framework Guides
- [React Integration](./docs/frameworks/react.md)
- [Vue 3 Integration](./docs/frameworks/vue.md)
- [Svelte Integration](./docs/frameworks/svelte.md)
- [Angular Integration](./docs/frameworks/angular.md)
- [React Native Integration](./docs/frameworks/react-native.md)
- [Web Components](./docs/frameworks/web-components.md)

### Feature Guides
- [Session Replay](./docs/features/session-replay.md)
- [Heatmaps](./docs/features/heatmaps.md)
- [Cohort Analysis](./docs/features/cohorts.md)
- [Dashboards](./docs/features/dashboards.md)
- [AI Insights](./docs/features/ai-insights.md)
- [A/B Testing](./docs/features/ab-testing.md)
- [Real-time Collaboration](./docs/features/realtime.md)

### API Reference
- [SDK API](./docs/api/sdk.md)
- [Widgets API](./docs/api/widgets.md)
- [Analytics API](./docs/api/analytics.md)
- [Hooks API](./docs/api/hooks.md)

### Migration Guides
- [v6.0 → v7.0](./docs/migration/v7.md)
- [v5.0 → v6.0](./docs/migration/v6.md)
- [v4.0 → v5.0](./docs/migration/v5.md)
- [v3.0 → v4.0](./docs/migration/v4.md)

### Version Summaries
- [v7.0 Implementation](./V7-IMPLEMENTATION-SUMMARY.md)
- [v6.0 Implementation](./V6-IMPLEMENTATION-SUMMARY.md)
- [v5.0 Implementation](./V5-IMPLEMENTATION-SUMMARY.md)
- [v4.0 Implementation](./V4-IMPLEMENTATION-SUMMARY.md)

### Other
- [Architecture](./docs/architecture.md)
- [Security](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)
- [License](./LICENSE)

---

## 🎯 Examples

Complete working examples in the `examples/` directory:

- **E-Commerce Demo** - Shopping cart with session replay, heatmaps, funnel analysis
- **SaaS Dashboard** - Analytics platform with cohorts, A/B testing, real-time collaboration
- **Mobile App** - React Native with touch tracking and crash reporting
- **Content Platform** - Blog with scroll heatmaps and engagement tracking
- **Onboarding Flow** - User onboarding with surveys and product tours

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **Bundle Size** | 150KB (minified + gzipped) |
| **Load Time** | <100ms (first paint) |
| **Memory Usage** | <5MB (active session) |
| **CPU Impact** | <2% (idle), <10% (active) |
| **Network** | Client-side only, zero external calls |

---

## 🔒 Security & Privacy

- ✅ **Client-side Processing** - All data stays in the browser
- ✅ **PII Filtering** - Automatic redaction of sensitive data
- ✅ **XSS Protection** - HTML sanitization on all user inputs
- ✅ **Rate Limiting** - Prevent abuse and DoS
- ✅ **CSP Compliant** - Works with strict Content Security Policies
- ✅ **GDPR/CCPA Ready** - Privacy-first by design
- ✅ **No Cookies** - Uses localStorage for minimal tracking
- ✅ **Open Source** - Fully auditable code

---

## 🌟 Why Vantage AI?

### vs. Competitors

| Feature | Vantage AI | FullStory | LogRocket | Hotjar | Mixpanel |
|---------|------------|-----------|-----------|--------|----------|
| **Open Source** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Privacy-First** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Client-Side** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Session Replay** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Heatmaps** | ✅ (5 types) | ⚠️ | ❌ | ✅ | ❌ |
| **Mobile SDK** | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Cohort Analysis** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **RFM Segmentation** | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| **AI Insights** | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| **A/B Testing** | ✅ | ❌ | ❌ | ⚠️ | ✅ |
| **Custom Dashboards** | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| **Web Components** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Real-time Collab** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Framework Support** | 6 | 3 | 3 | 2 | 4 |
| **Pricing** | **FREE** | $$$$ | $$$$ | $$$ | $$$ |

### Key Differentiators

1. **100% Open Source** - No vendor lock-in, fully auditable
2. **Privacy-First** - Client-side processing, automatic PII filtering
3. **Complete Framework Coverage** - React, Vue, Svelte, Angular, React Native, Web Components
4. **AI-Powered** - Anomaly detection, forecasting, automated insights
5. **Enterprise Features** - Cohorts, RFM, dashboards, A/B testing, real-time collaboration
6. **Zero Server Costs** - Everything runs in the browser
7. **Lightweight** - 150KB total, <100ms load time
8. **Self-Hosted** - Full data ownership and control

---

## 🤝 Contributing

We welcome contributions of all kinds! Here's how you can help:

### 🐛 Bug Reports
Found a bug? [Open an issue](https://github.com/vantage-ai/vantage-ai/issues/new?template=bug_report.md)

### ✨ Feature Requests
Have an idea? [Suggest a feature](https://github.com/vantage-ai/vantage-ai/issues/new?template=feature_request.md)

### 📝 Documentation
Improve our docs by submitting a PR!

### 🌍 Translations
Add support for your language in `packages/vantage-i18n/`

### 🎨 New Widgets
Create custom widgets in `packages/vantage-widgets/`

### 🧪 Tests
Increase test coverage in any package

### Good First Issues
- [ ] Add Snowflake analytics adapter
- [ ] Create Qwik framework integration
- [ ] Build gauge chart widget
- [ ] Add Korean translation
- [ ] Implement funnel comparison view
- [ ] Write E2E tests for dashboards

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

MIT License - see [LICENSE](./LICENSE) for details.

**Free to use in commercial and open-source projects.**

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- TypeScript
- React, Vue, Svelte, Angular
- pnpm workspaces
- Vitest
- tsup

Special thanks to all contributors and the open-source community!

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=vantage-ai/vantage-ai&type=Date)](https://star-history.com/#vantage-ai/vantage-ai&Date)

If you find Vantage AI useful, please **⭐ star the repo** to help others discover it!

---

## 📞 Support

- **Documentation**: [docs.vantage-ai.dev](https://docs.vantage-ai.dev)
- **GitHub Issues**: [Report bugs](https://github.com/vantage-ai/vantage-ai/issues)
- **Discussions**: [Ask questions](https://github.com/vantage-ai/vantage-ai/discussions)
- **Discord**: Coming soon
- **Email**: support@vantage-ai.dev

---

## 🗺️ Roadmap

### v8.0 (Planned)
- [ ] Vue 2 Support
- [ ] Next.js App Router Integration
- [ ] Chrome Extension for debugging
- [ ] Visual Playbook Editor
- [ ] SQL Query Builder for cohorts
- [ ] Data Warehouse Connectors (Snowflake, BigQuery)

### v9.0 (Planned)
- [ ] Python SDK for backend analytics
- [ ] GraphQL API
- [ ] Multi-tenant support
- [ ] Role-based access control
- [ ] Audit logging
- [ ] SSO integration

### Community Requests
- [ ] Flutter SDK
- [ ] Unity plugin
- [ ] Jupyter notebook integration
- [ ] Slack notifications
- [ ] Email reports

---

**Built with ❤️ by the Vantage AI community**

**Star us on GitHub** ⭐ | **Follow for updates** 🔔 | **Contribute** 🤝
