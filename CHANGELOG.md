# Changelog

All notable changes to BuildTrack are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-04-14

### Added
- **Modular Architecture** — Decomposed monolithic `App.jsx` (4,600+ lines) into 16 feature modules, 13 shared components, 3 layout components, and dedicated hooks/utils/constants directories
- **Budget Overrun Detection** — Live warning banner in DPR form when cost exceeds remaining budget; red alert on Dashboard listing affected projects
- **Admin-Only Delete** — Delete button on Labour Register attendance entries (admin role only, with confirmation prompt)
- **Project Data Refresh** — Dashboard and Financials automatically reflect new spend after DPR submission
- **Barrel Exports** — Shared UI component library with `src/components/index.js` barrel export

### Changed
- `App.jsx` reduced from ~4,600 lines to ~190-line root shell handling auth, routing, and layout
- Total Spent KPI card turns red when global spend exceeds global budget
- DPR sticky submit bar shows danger-colored total when budget would be exceeded

### Fixed
- Missing constants (`STAGES_DETAIL`, `ISSUE_CATEGORIES`, `CATEGORY_OPTIONS`) restored after extraction
- Labour Register wage calculation constants preserved during refactor

## [0.1.0] — 2026-04-07

### Added
- **Dashboard** with KPI cards and count-up animations
- **Projects** CRUD with budget tracking, GPS location, satellite maps
- **Submit DPR** with cascading dropdowns, cost breakdown, photo upload
- **Site Issues** with AI-powered classification (via Groq/Llama 3.3)
- **Labour Register** with 4-tab system (bulk entry, workers, attendance, reports)
- **Reports** with 5-tab analytics (cost trends, DPR table, photos, stage progress)
- **Materials** inventory with trigger-maintained stock levels
- **Financials** dashboard with budget vs actual charts
- **AI Assistant** with context-aware project Q&A
- **User Management** with role-based access control
- **Landing Page** with premium SaaS design
- **CI/CD** pipeline with ESLint + Vite build on GitHub Actions
- Row-Level Security on all 14 database tables
- PDF and CSV export for reports and projects
