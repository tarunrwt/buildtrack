# BuildTrack — Construction Progress Management

> Real-time construction project tracking with Daily Progress Report (DPR) automation, cost monitoring, inventory management, and team coordination.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite                     |
| UI         | Custom design system (no CSS framework) |
| Charts     | Recharts                            |
| Icons      | Lucide React                        |
| Backend    | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Region     | ap-south-1 (Mumbai)                 |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (project already provisioned — see credentials below)

### Installation

```bash
# Clone the repository
git clone https://github.com/tarunrwt/buildtrack.git
cd buildtrack

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
buildtrack/
├── src/
│   ├── App.jsx          # Main application (all pages and components)
│   ├── main.jsx         # React root entry point
│   └── lib/
│       └── supabase.js  # Supabase client initialisation
├── supabase/
│   └── README.md        # Schema migration notes
├── index.html
├── vite.config.js
├── .env.example         # Environment variable template
└── package.json
```

---

## Features

**Dashboard** — Welcome banner with last sign-in, summary KPIs, and six quick-action cards for all modules.

**Projects** — Create, edit, and delete construction projects with budget tracking, site area, GPS coordinates, and progress visualisation.

**Submit DPR** — Daily Progress Report form with project selection, weather picker, cascading floor → stage dropdowns, manpower, cost breakdown (labor / material / equipment / subcontractor / other), and auto-calculated totals.

**Reports** — Five-tab view: Overview (cost trend, manpower/cost dual chart), Analytics (cost by category, project progress), Reports (filterable DPR table), Photos (site photo gallery with upload), Stages (full layout and execution stage progress tracker). PDF and Excel/CSV export included.

**Materials & Inventory** — Material cards with low-stock alerts, usage log, purchase history, and analytics with category breakdown.

**Financial Dashboard** — Budget vs. Actual bar chart, cost category donut, monthly trend, per-project breakdown, and export.

**User Management** — Team members table, role badge system, invite modal with project assignment.

---

## Database Schema

Ten tables in PostgreSQL with full Row Level Security:

| Table                      | Purpose                                      |
|----------------------------|----------------------------------------------|
| `projects`                 | Core project entities                        |
| `daily_reports`            | DPR submissions with generated total_cost    |
| `dpr_photos`               | Photo metadata linked to reports             |
| `materials`                | Inventory master list                        |
| `material_usage`           | Usage log (auto-decrements stock)            |
| `material_purchases`       | Procurement log (auto-increments stock)      |
| `user_roles`               | RBAC role definitions (seeded)               |
| `user_project_assignments` | User ↔ Project ↔ Role join table             |
| `notifications`            | Per-user notification inbox                  |
| `project_stage_progress`   | Stage completion tracking per project        |

### Key Design Decisions
- All RLS policies use `(SELECT auth.uid())` for single evaluation per query, not per row.
- `daily_reports.total_cost` is a `GENERATED ALWAYS AS` computed column — no trigger required and can never fall out of sync.
- `material_purchases.total_cost` is likewise computed from `quantity × unit_cost`.
- Stock updates use a single consolidated trigger function each (original schema had duplicate pairs).
- `notifications` INSERT is restricted to `service_role` only, preventing the original vulnerability where any authenticated user could insert notifications for any other user.
- `user_roles` is seeded with Admin, Project Manager, Site Engineer, and Accountant on first migration.

---

## Environment Variables

| Variable                  | Description                    |
|---------------------------|--------------------------------|
| `VITE_SUPABASE_URL`       | Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`  | Supabase publishable anon key  |

---

## Supabase Project

- **Project ID:** `zdcuroihwhtixolkxgbj`
- **URL:** `https://zdcuroihwhtixolkxgbj.supabase.co`
- **Region:** ap-south-1 (Mumbai)
- **Storage bucket:** `dpr-photos` (10 MB limit, JPEG/PNG/WebP/HEIC)

---

## License

MIT — see LICENSE for details.
