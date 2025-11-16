# Contributing to Vantage AI

Thanks for your interest in improving **Vantage AI**!

We welcome:

- Bug reports
- Feature requests
- New detectors (behavior, network, DOM)
- New widgets (tooltips, checklists, toasts)
- New playbooks (SaaS flows, onboarding flows, etc.)
- Performance optimizations
- In-browser AI engine integrations

## Getting Started

```bash
pnpm install
pnpm build
pnpm dev
```

Then open http://localhost:5173 (ecommerce demo).

## Good First Issues

- Add a new detector (hover loops, navigation loops, etc.)
- Create a tooltip widget
- Create a checklist widget
- Add configuration docs
- Add TypeScript types improvements

We tag these with `good first issue` in GitHub.

## Code Style

- TypeScript strict mode
- Prefer small, composable modules
- Avoid product-specific naming in core packages

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Commit your changes with descriptive messages
6. Push to your fork
7. Open a Pull Request

## Code of Conduct

Be respectful, inclusive, and collaborative. We're all here to build something great together.
