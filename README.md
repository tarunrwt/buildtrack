<div align="center">

# 🏗️ BuildTrack

### Construction Progress Management Platform

**Digitise daily site operations — from DPR submission to financial analytics.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-buildtrack--alpha.vercel.app-F97316?style=for-the-badge&logo=vercel&logoColor=white)](https://buildtrack-alpha.vercel.app)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![CI](https://github.com/tarunrwt/buildtrack/actions/workflows/ci.yml/badge.svg)](https://github.com/tarunrwt/buildtrack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

Construction site management in India still runs on paper. Daily Progress Reports get handwritten, photographed, and WhatsApp'd to the office — where someone types them into a spreadsheet. Budget problems get noticed a month late. Materials run out without warning.

BuildTrack replaces that entire workflow. Engineers submit DPRs from the field in under 60 seconds. Project managers see live dashboards. Materials and labour are tracked automatically.

---

## Screenshots

<div align="center">

### Dashboard
![Dashboard — KPI summary, quick actions, and project overview](docs/screenshots/dashboard.png)

### Daily Progress Report
![Submit DPR — weather, manpower, cost breakdown, photo upload](docs/screenshots/submit-dpr.png)

### Reports & Analytics
![Reports — cost trends, stage progress, filterable DPR table](docs/screenshots/reports.png)

### Financial Dashboard
![Financials — budget vs actual, cost categories, monthly trends](docs/screenshots/financials.png)

</div>

---

## What it does

| Module | Capabilities |
|--------|-------------|
| **Dashboard** | KPI cards with count-up animations · Quick-action navigation · Delayed project alerts |
| **Projects** | Create/edit with budget, GPS, site area · Budget utilisation bars · Project-level PDF reports |
| **Submit DPR** | One-tap weather selector · Cascading floor → stage dropdowns · Full cost breakdown (labour, material, equipment, subcontractor, other) · Auto-calculated totals · Site photo upload |
| **Reports** | 5-tab layout: Cost Trends · Analytics · DPR Table · Photo Gallery · Stage Progress · CSV and PDF export |
| **Materials** | Inventory cards with low-stock pulse alerts · Usage/purchase history · Stock auto-updated via database triggers |
| **Financials** | Budget vs. Actual bar charts · Cost category donut · Monthly spend trends · Per-project financial breakdown |
| **Labour Register** | Category-based tracking (unskilled → supervisor) · Daily headcount trends · Bulk attendance entry |
| **Site Issues** | Field problem logging with AI classification (material delay, equipment failure, weather disruption, etc.) |
| **AI Assistant** | Context-aware project Q&A powered by Groq (Llama 3.3). Responds in English or Hindi. |
| **User Management** | Role-based access (Admin, PM, Engineer, Accountant, Viewer) · Project-level assignments · Invite system |

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Frontend | React 18 + Vite 5 | Fast builds; no framework overhead |
| Charts | Recharts | Works cleanly with React without a heavy D3 setup |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Backend | Supabase (PostgreSQL 17) | Row-level security, realtime, storage, and auth in one service |
| Styling | Custom CSS + Tailwind (landing page only) | Full control over the app design system; Tailwind for the marketing page |
| Deployment | Vercel | Auto-deploys on push; India region (`ap-south-1`) |
| AI | Groq (Llama 3.3) via Supabase Edge Function | Fast inference for the assistant and issue classification |
| Maps | Leaflet + Esri World Imagery | Satellite view for site location with drag-to-pin |

---

## Database Design

14 tables with full Row Level Security. Key decisions:

- **`daily_reports.total_cost` is a `GENERATED ALWAYS` column** — computed by PostgreSQL from the five cost breakdown fields. The total can never drift between the DPR form, the dashboard, and the financial reports.
- **All RLS policies use `(SELECT auth.uid())`** — evaluated once per query, not once per row. This matters at scale when a table has thousands of DPR records.
- **Stock levels are maintained by triggers** — `material_usage` decrements stock, `material_purchases` increments it. Application state can never corrupt inventory figures.

Full schema documentation: [`supabase/README.md`](supabase/README.md)

---

## Setup

**Prerequisites:** Node.js 18+, a [Supabase](https://supabase.com) project with the schema applied.

```bash
# 1. Clone the repository
git clone https://github.com/tarunrwt/buildtrack.git
cd buildtrack

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and add your Supabase project URL and anon key

# 4. Start the development server
npm run dev
# App runs at http://localhost:5173
```

**Build for production:**

```bash
npm run build   # Output in dist/
npm run preview # Preview the production build locally
```

### Database Setup

The schema is documented in [`supabase/README.md`](supabase/README.md). To set up your own instance, create a Supabase project and apply the schema using the SQL Editor. Contact the author for the migration files.

---

## Environment Variables

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon public key |

The `.env` file is gitignored. Never commit it.

---

## Project Structure

```
buildtrack/
├── .github/
│   └── workflows/
│       └── ci.yml              # Lint + build check on every push
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx                 # All app pages, components, and routing
│   ├── main.jsx                # React root mount
│   ├── landing/
│   │   ├── Landing.jsx         # Public-facing marketing page
│   │   └── landing.css         # Landing page styles
│   └── lib/
│       ├── supabase.js         # Supabase client initialisation
│       ├── financialEngine.ts  # Single source of truth — all financial calculations
│       └── reportEngine.ts     # Single source of truth — report aggregations
├── supabase/
│   └── README.md               # Database schema reference
├── docs/
│   └── screenshots/            # App screenshots for documentation
├── .env.example                # Environment variable template
├── .eslintrc.cjs               # ESLint configuration
├── .prettierrc                 # Prettier formatting rules
├── index.html                  # Entry point with SEO meta tags
├── LICENSE                     # MIT
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------| 
| **Single-file React app** | MVP-phase simplicity — all pages and components in `App.jsx` with clear section headers. A feature-based folder split is on the roadmap. |
| **No CSS framework (in the app)** | Full control over the design language — dark navy sidebar, construction-orange accents, Barlow typeface. Tailwind is used only on the marketing landing page. |
| **Generated columns over app-side calculation** | `daily_reports.total_cost` is computed by PostgreSQL — self-healing, tamper-proof, zero client-side drift. |
| **Centralised financial engine** | `financialEngine.ts` means the dashboard, reports, and financials pages all show identical numbers. No dual computation paths. |
| **RLS with `(SELECT auth.uid())`** | Evaluated once per query, not once per row. Critical for tables with thousands of DPR records. |

---

## Roadmap

- [ ] Split `App.jsx` into feature modules (`features/projects`, `features/labour`, etc.)
- [ ] Error boundaries to prevent blank-screen crashes on uncaught exceptions
- [ ] Realtime DPR updates via Supabase Realtime subscriptions
- [ ] Offline-first DPR submission with a service worker
- [ ] React Native mobile app for site engineers
- [ ] Server-side PDF generation with embedded charts
- [ ] Multi-tenant organisation isolation

---

## A note on how this was built

I used Claude (Anthropic) as a collaborator throughout this project — for code review, architectural decisions, and debugging. Every line in this repository was read, understood, and deliberately chosen by me. The AI helped me move faster and think through edge cases I would have otherwise missed.

I'm mentioning this because hiding AI involvement in portfolio projects is dishonest. The construction domain knowledge, the product decisions, the database design, and the final code are mine. The AI was a tool, not the author.

---

## Author

**Tarun Rawat** — CS Diploma student, ML and Gen AI enthusiast, former NCC Cadet.

[![GitHub](https://img.shields.io/badge/GitHub-tarunrwt-181717?style=flat-square&logo=github)](https://github.com/tarunrwt)

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

*Built for India's construction industry — 2026*

</div>
