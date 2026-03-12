# BuildTrack — Construction Progress Management

A full-stack web application for automating Daily Progress Reports (DPRs) on construction sites — featuring real-time cost tracking, inventory management, stage-wise progress monitoring, and team coordination.

Built as a learning project to develop practical skills in **vibe coding**, **AI-assisted development**, and **full-stack engineering** with modern tooling.

---

## What This Project Is

BuildTrack solves a real problem in construction management: the manual, paper-based process of tracking daily site progress, costs, and material usage across multiple projects and teams. The application digitises the entire workflow — from submitting a daily report in the field to viewing financial analytics in the office.

---

## Skills Developed

### Vibe Coding
The entire application was built through iterative, conversational development with an AI assistant rather than writing code line by line. This approach — often called vibe coding — involves describing what you want, reviewing the output, identifying what needs to change, and refining through structured feedback. The skill lies not in typing code, but in maintaining a clear vision of the product, recognising flaws quickly, and directing improvements precisely.

### AI Prompting
Every feature, bug fix, and architectural decision in this project was driven by a prompt. Writing good prompts for a complex, multi-screen application requires the same structured thinking as writing a good technical specification: clear context, explicit constraints, concrete examples, and a defined output format. A selection of the prompts used throughout this project is documented below.

### Full-Stack Development Concepts
Working through this project, even in a vibe coding workflow, builds genuine understanding of how full-stack systems are structured. Concepts encountered and applied include:

- Component architecture and state management in React
- Relational database design with foreign keys, computed columns, and normalisation
- Row Level Security and why per-row vs. per-query policy evaluation matters for performance
- Storage buckets, access policies, and file path scoping
- Database triggers and the difference between a generated column and a trigger-maintained aggregate
- Environment variable management and secrets hygiene in a Git workflow

---

## Prompting Log

The following prompts were used to build this project from the ground up. They are presented here as a structured record of the AI-assisted development process — both as personal documentation and as a practical reference for others exploring vibe coding and prompt engineering.

Each prompt is written in the form it was actually submitted. The key skill being developed is not the sophistication of any single prompt, but the ability to move a complex product forward incrementally through clear, well-directed instructions.

---

### Phase 1 — Planning & Architecture

**Prompt 1 — Project Scoping**

> *"I want to build a web application for construction site management. The core feature is a Daily Progress Report system where site engineers can submit what work was done each day, how many workers were present, what the weather was, and a full cost breakdown across labor, materials, equipment, and other expenses. The app also needs project management, a materials and inventory module, a financial dashboard, and a team management section. Define the complete feature set, suggest the right tech stack, and outline the database schema I will need."*

**Intent:** Begin with a broad product brief rather than jumping straight to code. Defining scope, stack, and schema in one pass ensures that architectural decisions are made deliberately before any implementation begins.

---

**Prompt 2 — Database Design**

> *"Design a complete PostgreSQL database schema for BuildTrack. It should cover projects, daily progress reports with a computed total cost column, photo uploads linked to reports, a materials inventory system with stock automatically updated by usage and purchase triggers, a role-based access control system with an assignments table linking users to projects with a specific role, a per-user notifications table, and a stage progress tracker per project. Use lookup tables for floors and stages rather than free-text fields. Include all foreign keys, constraints, and check conditions."*

**Intent:** A detailed schema prompt with explicit requirements for computed columns, triggers, lookup tables, and constraints — rather than asking for a generic schema and fixing problems later.

---

### Phase 2 — Backend Setup

**Prompt 3 — Supabase Configuration**

> *"Set up the full backend for BuildTrack on Supabase. Apply the schema, then configure Row Level Security on every table so that users can only access their own data. All RLS policies must use `(SELECT auth.uid())` rather than `auth.uid()` directly, so that the user ID is evaluated once per query rather than once per row. Add a covering index on every foreign key column. Create a Storage bucket called `dpr-photos` with a 10 MB file size limit, restricted to image types only, and with access policies scoped to each user's own folder path. Seed the user roles table with Admin, Project Manager, Site Engineer, and Accountant."*

**Intent:** Infrastructure prompts benefit from being explicit about security and performance requirements — not just "set up RLS" but *how* it should be configured and why. This avoids common Supabase pitfalls like per-row policy evaluation and missing indexes.

---

### Phase 3 — Frontend Development

**Prompt 4 — Full Application Build**

> *"Build the complete BuildTrack frontend as a single production-quality React file using Vite. The application must include the following pages: a landing page, an authentication screen with sign in and sign up, an admin dashboard with KPI summary cards and quick-action navigation, a projects page with create and edit functionality, a DPR submission form with a weather selector and cascading floor-to-stage dropdowns, a reports page with five tabs covering overview charts, analytics, a filterable DPR table, a site photo gallery, and a stage progress tracker, a materials and inventory page with four tabs, a financial dashboard with budget versus actual charts and cost category breakdowns, and a user management page. Do not use any CSS framework. The design should feel industrial and professional — dark navy sidebar, construction-orange accent colour, Barlow typeface, white cards on a slate background."*

**Intent:** A complete, single-prompt application specification with a clear design direction. Specificity about colour, typography, and layout avoids generic output and produces a cohesive visual identity from the first pass.

---

**Prompt 5 — Quality Assurance Pass**

> *"Go through the entire application systematically — every page, every tab, every button, every component. Read all the code carefully before making any changes. Identify every bug, broken interaction, incorrect data value, dead event handler, and anything that does not behave as intended. Then fix everything you find in a single pass."*

**Intent:** A structured QA prompt that specifies reading the code before touching it. This prevents fixes being applied without full context, which often introduces new bugs while resolving existing ones.

---

## Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| Frontend    | React 18, Vite                                    |
| Charts      | Recharts                                          |
| Icons       | Lucide React                                      |
| Backend     | Supabase (PostgreSQL 17, Auth, Storage, RLS)      |
| Region      | ap-south-1 — Mumbai                               |
| Deployment  | Vite build → static hosting                       |

---

## Database Schema

Twelve tables with full Row Level Security across every user-facing entity.

| Table                        | Purpose                                                   |
|------------------------------|-----------------------------------------------------------|
| `projects`                   | Core project records                                      |
| `daily_reports`              | DPR submissions with auto-computed `total_cost`           |
| `dpr_photos`                 | Photo metadata linked to reports and projects             |
| `materials`                  | Inventory master list                                     |
| `material_usage`             | Usage log — auto-decrements stock via trigger             |
| `material_purchases`         | Procurement log — auto-increments stock via trigger       |
| `user_roles`                 | RBAC role definitions (seeded: Admin, PM, Engineer, Accountant) |
| `user_project_assignments`   | User ↔ Project ↔ Role assignment table                   |
| `notifications`              | Per-user notification inbox (server-side insert only)     |
| `project_stage_progress`     | Stage completion percentage per project                   |
| `floors`                     | Lookup table — replaces free-text floor field             |
| `stages`                     | Lookup table — replaces free-text stage field             |

---

## Running Locally

```bash
git clone https://github.com/tarunrwt/buildtrack.git
cd buildtrack
npm install
cp .env.example .env
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env
npm run dev
```

The development server starts at `http://localhost:5173`.

---

## Application Features

**Dashboard** — Summary KPIs, recent activity, and quick-access cards for all modules.

**Projects** — Create and edit projects with budget, site area, GPS coordinates, and budget utilisation progress bars.

**Submit DPR** — Weather selector, cascading floor → stage dropdowns, manpower count, full cost breakdown with auto-calculated total, and draft saving.

**Reports** — Five tabs: cost trend charts, analytics with category breakdown, filterable DPR table, site photo gallery, and stage-by-stage progress tracker. PDF and CSV export functional.

**Materials & Inventory** — Material cards with low-stock alerts, usage log, purchase history, and category analytics.

**Financial Dashboard** — Budget vs. actual bar chart, cost category donut, monthly expenditure trend, and per-project financial summary.

**User Management** — Team member table with roles, role permissions reference, and invite modal with project assignment.

---

*Built by Tarun Rawat — 2026*
