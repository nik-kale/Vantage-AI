# Vantage AI Architecture

## Overview

Vantage AI is designed as a modular, browser-native framework with minimal dependencies.

## High-Level Design

```
┌─────────────────────────────────────────────┐
│              Browser Window                 │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │      Vantage SDK (Core)               │ │
│  │                                       │ │
│  │  ┌─────────────┐  ┌────────────────┐ │ │
│  │  │ Collectors  │  │   Detectors    │ │ │
│  │  │             │  │                │ │ │
│  │  │ - DOM       │  │ - Rage Clicks  │ │ │
│  │  │ - Network   │  │ - Form Fails   │ │ │
│  │  │ - Errors    │  │ - Nav Loops    │ │ │
│  │  └─────────────┘  └────────────────┘ │ │
│  │                                       │ │
│  │  ┌─────────────────────────────────┐ │ │
│  │  │   Suspicion Engine             │ │ │
│  │  │   (Lite Mode: Rules)           │ │ │
│  │  └─────────────────────────────────┘ │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   Vantage Engine (Optional AI)        │ │
│  │   - SLM / ONNX / Transformers.js      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │   Vantage Widgets                     │ │
│  │   - Banners                           │ │
│  │   - Tooltips                          │ │
│  │   - Checklists                        │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Component Breakdown

### 1. Collectors
- **Purpose**: Gather raw signals from the browser
- **Types**:
  - DOM Collector: Mutation observers, element queries
  - Network Collector: Fetch/XHR interception
  - Error Collector: Global error handlers

### 2. Detectors
- **Purpose**: Convert raw signals into structured events
- **Examples**:
  - Rage clicks (5+ clicks in 5s)
  - Form failures (repeated submissions with errors)
  - Navigation loops (back/forward patterns)

### 3. Suspicion Engine
- **Purpose**: Score events and match against playbooks
- **Modes**:
  - **Lite**: Rule-based heuristics only
  - **AI**: Enhanced with in-browser ML models

### 4. Playbooks
- **Purpose**: Map patterns to user guidance
- **Format**: JSON/YAML configuration
- **Match Conditions**: Categories, scores, routes, text patterns

### 5. Widgets
- **Purpose**: Render contextual guidance
- **Types**: Banners, tooltips, checklists
- **Framework Support**: React (with plans for Vue, Svelte, vanilla JS)

### 6. Vantage Engine (Optional)
- **Purpose**: Advanced AI/ML inference
- **Backends**: ONNX Runtime Web, WebLLM, Transformers.js
- **Use Cases**: Complex pattern recognition, anomaly detection

## Data Flow

1. User interacts with page
2. Collectors observe events (clicks, DOM changes, network)
3. Detectors process events into signals
4. Suspicion Engine evaluates signals
5. If match found in playbook → trigger recommendation
6. Widget renders guidance to user

## Privacy & Performance

- **No Server Required**: All processing happens in the browser
- **No PII Collection**: Only behavioral patterns, no user data
- **Minimal Overhead**: < 50kb gzipped for lite mode
- **Lazy Loading**: AI engine only loads if needed

## Extension Points

- Custom detectors
- Custom collectors
- Custom playbooks
- Custom widgets
- Custom AI backends
