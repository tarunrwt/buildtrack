# Contributing to BuildTrack

Thank you for your interest in contributing to BuildTrack! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/buildtrack.git`
3. **Install** dependencies: `npm install`
4. **Create a branch** for your change (see naming convention below)
5. **Make your changes** and test them
6. **Push** to your fork and **open a Pull Request**

## Branch Naming Convention

```
type/short-description
```

| Type | Use For |
|------|---------|
| `feat/` | New features (e.g. `feat/offline-dpr-submission`) |
| `fix/` | Bug fixes (e.g. `fix/budget-calculation-overflow`) |
| `refactor/` | Code restructuring (e.g. `refactor/extract-labour-hooks`) |
| `docs/` | Documentation updates (e.g. `docs/update-api-reference`) |
| `chore/` | Maintenance tasks (e.g. `chore/upgrade-vite-6`) |

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons (no code change) |
| `refactor` | Code restructuring (no feature/fix) |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, config |

### Examples

```
feat(dpr): add budget overrun warning to cost breakdown
fix(dashboard): correct total spent calculation for deleted projects
refactor(labour): extract attendance hooks into shared utils
docs(readme): update project structure after modular refactor
chore(deps): upgrade react to 18.3.1
```

## Development Guidelines

### Code Style

- Use **functional components** with hooks
- Use the `C` design token palette from `src/constants/colors.js`
- Use shared UI components from `src/components/` — don't create one-off styled elements
- Keep feature modules self-contained in `src/features/`
- Format with Prettier: `npm run format`

### Before Submitting a PR

```bash
npm run lint     # Must pass with no new warnings
npm run build    # Must succeed with no errors
```

### Financial Logic

All financial calculations must go through `src/lib/financialEngine.ts`. Never compute budget, spent, or remaining values inline — use the engine as the single source of truth.

## Reporting Bugs

Use the [Bug Report template](https://github.com/tarunrwt/buildtrack/issues/new?template=bug_report.md) and include:
- Steps to reproduce
- Expected vs actual behaviour
- Browser and device information
- Console errors (if any)

## Code of Conduct

Be respectful, constructive, and assume good intent. We're building something useful for India's construction industry — let's keep the conversation focused and welcoming.

---

Thank you for contributing! 🏗️
