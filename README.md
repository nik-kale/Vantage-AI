# Vantage AI

### Real-Time, In-Browser UX Intelligence & Guidance

**Vantage AI** is a **browser-native AI framework** that helps your users when they actually need help.

It observes:

- 🖱️ **Behavior** – rage clicks, repeated failures, abandonments
- 🧩 **DOM state** – visible error messages, modals, disabled buttons
- 🌐 **Network signals** – API failures, slow responses

…then uses **rules or an optional in-browser SLM engine** to detect friction and show **contextual in-product guidance**:

- Banners
- Tooltips
- Checklists

All in **real time**, with a **privacy-first**, **edge-centric** design.

---

## Why Vantage AI?

Modern SaaS users are still stuck:

- Confusing flows
- Silent failures
- "Try again later" errors
- Overloaded support & docs

Traditional DAP tools (WalkMe, Appcues, etc.) are powerful but:

- 🧱 Often rigid and heavy
- 💸 Expensive for smaller teams
- 🐌 Not designed for real-time AI-driven behavior understanding
- ☁️ Cloud-first, not edge-first

**Vantage AI** gives you a **developer-first, open-source, real-time DAP-like framework** that you can drop into any web app.

---

## High-Level Architecture

```text
Browser
 ├─ Vantage SDK        (event capture: DOM, clicks, errors, network)
 ├─ Suspicion Engine   (cheap heuristics: rage clicks, time spent, failures)
 ├─ Vantage Engine     (optional in-browser SLM/ML for deeper insight)
 └─ Vantage Widgets    (banners, tooltips, checklists for guidance)
```

- **Lite mode**: Rules + heuristics only
- **AI mode**: Rules + heuristics + browser-based SLM/ML scoring

---

## Packages

- **@vantage-ai/sdk**
  Core JS/TS SDK for browser instrumentation and signal generation.

- **@vantage-ai/engine**
  Optional AI/ML engine for in-browser analysis (SLM/WebGPU or ONNX Web).

- **@vantage-ai/widgets**
  Headless + React components for banners, tooltips, checklists.

- **@vantage-ai/playbooks**
  JSON/YAML playbooks mapping patterns → guidance content.

---

## Example Use Case

"If a user clicks 'Submit' 4+ times in 30 seconds and sees the same validation error, show them a banner with a short explanation + link to a help article."

Vantage AI makes that:

1. Easy to detect
2. Easy to configure in a playbook
3. Easy to present with UI widgets

---

## Quick Start (Conceptual)

```typescript
import { initVantage } from "@vantage-ai/sdk";
import { createBannerRenderer } from "@vantage-ai/widgets";
import playbooks from "@vantage-ai/playbooks/default";

const vantage = initVantage({
  mode: "lite", // 'lite' or 'ai'
  playbooks,
  onTrigger: (recommendation) => {
    createBannerRenderer().show(recommendation);
  }
});

vantage.start();
```

Check the `examples/` folder for a runnable ecommerce demo.

---

## Roadmap

- ✅ Rage click & failure detectors
- ✅ Lite rule-based suspicion engine
- ✅ Basic banner widget
- ⏳ Optional in-browser SLM integration
- ⏳ Tooltips & checklist widgets
- ⏳ Analytics integrations (Amplitude, Segment, etc.)
- ⏳ React hook bindings
- ⏳ Privacy + compliance helpers

---

## Contributing

We actively welcome contributions:

- New detectors
- New widgets
- New playbooks
- Performance improvements
- Alternative engine backends (ONNX, WebLLM, etc.)

See `CONTRIBUTING.md` for details.

---

## License

MIT – use it freely in commercial and open-source projects.
