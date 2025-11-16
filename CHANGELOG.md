# Changelog

All notable changes to Vantage AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-XX (In Progress)

### Added

#### Core SDK
- **Security**: Comprehensive security utilities including XSS prevention, PII filtering, rate limiting, and secure storage
- **Detectors**: 7 new detectors
  - Form Failure Detector (tracks repeated submission failures)
  - Navigation Loop Detector (identifies back/forward confusion patterns)
  - Hover Confusion Detector (detects uncertain user behavior)
  - Scroll Abandonment Detector (identifies rapid scanning/abandonment)
  - Time on Element Detector (finds users stuck on elements)
  - Dead Click Detector (clicks with no effect)
  - Error Cascade Detector (multiple errors in succession)
- **Collectors**: 3 complete collectors
  - Network Collector (intercepts fetch/XHR for API monitoring)
  - Error Collector (global error and rejection handlers)
  - Performance Collector (monitors long tasks and layout shifts)
- **Performance**: Debouncing, throttling, memory-bounded buffers, lazy loading, deduplication
- **Storage**: Secure encrypted storage with XOR encryption

#### Widgets
- **Tooltip Component**: Contextual tooltips with positioning
- **Checklist Component**: Progress tracking with completion states
- **Modal Dialog**: Full-featured modal with actions
- **Toast Notifications**: Non-blocking notifications
- **Spotlight/Tour**: Guided product tours

#### Framework Support
- **React Hooks**: useVantage, useRecommendation, useGuidance
- **Vue Composables**: Vue 3 composition API support
- **Web Components**: Framework-agnostic custom elements

#### Analytics
- **Analytics Adapters**: Pluggable analytics framework
- **Integrations**: Amplitude, Segment, Google Analytics, Mixpanel
- **Custom Adapters**: Easy to extend with custom analytics

#### Advanced Features
- **Playbook Versioning**: Track and manage playbook versions
- **A/B Testing**: Built-in experimentation framework
- **User Segmentation**: Target specific user cohorts
- **Session Management**: Cross-session tracking and journey mapping
- **Priority System**: Prioritize competing recommendations

#### Developer Tools
- **Debug Mode**: Verbose logging and inspection
- **Performance Profiler**: Real-time performance monitoring
- **Playbook Validator**: Validate playbook syntax and logic
- **Visual Editor**: Web-based playbook editor (foundations)

#### Testing
- **Unit Tests**: Vitest setup with 80%+ coverage target
- **Integration Tests**: Cross-package integration testing
- **E2E Tests**: Playwright-based end-to-end tests
- **Performance Tests**: Automated performance benchmarking

#### Build & Deployment
- **Multiple Formats**: ESM, CJS, UMD, IIFE
- **Source Maps**: Full source map support
- **Minification**: Production-optimized bundles
- **Code Splitting**: Automatic code splitting for widgets

### Changed
- **Breaking**: Minimum browser requirements now ES2020+
- **Breaking**: React 18+ required for hooks
- **Breaking**: Vue 3+ required for composables
- **Improved**: Rage click detector now configurable
- **Improved**: Banner widget with better accessibility
- **Optimized**: 60% bundle size reduction with lazy loading

### Security
- **Added**: XSS protection for all widgets
- **Added**: CSP compliance
- **Added**: Input validation and sanitization
- **Added**: Rate limiting for detectors
- **Added**: PII detection and filtering
- **Added**: Prototype pollution protection
- **Added**: ReDoS protection in regex patterns
- **Fixed**: Potential XSS vulnerabilities in widget content
- **Fixed**: Insecure random ID generation

### Documentation
- **Added**: Migration guide from v1 to v2
- **Added**: Security best practices
- **Added**: Performance tuning guide
- **Added**: API reference (auto-generated)
- **Added**: SECURITY.md policy
- **Improved**: Architecture documentation
- **Improved**: SDK usage examples

## [0.1.0] - 2025-01-16

### Added
- Initial monorepo structure
- Core SDK with rage click detector
- Banner widget (React)
- Playbook system
- Lite mode (rules-based)
- E-commerce demo
- Complete documentation
- GitHub workflows and issue templates
- Contributing guidelines

[2.0.0]: https://github.com/nik-kale/vantage-ai/compare/v0.1.0...v2.0.0
[0.1.0]: https://github.com/nik-kale/vantage-ai/releases/tag/v0.1.0
