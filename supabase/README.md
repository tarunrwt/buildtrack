# BuildTrack — Database Schema Reference

BuildTrack uses **Supabase** (PostgreSQL 17) as its backend. This document describes the database architecture in plain terms. The SQL migration files are not included in this repository. If you need them for your own deployment, contact the author.

---

## Setup

1. Create a new [Supabase](https://supabase.com) project.
2. Copy `.env.example` to `.env` and fill in your project URL and anon key.
3. Apply the schema against your project using the Supabase SQL Editor.

---

## Tables

| Table | Purpose |
|-------|---------|
| `projects` | Core project records — name, budget, GPS coordinates, site area, and status. |
| `daily_reports` | One row per DPR submission. Stores weather, manpower count, cost breakdown, floor, and stage. `total_cost` is a `GENERATED ALWAYS` column (see below). |
| `dpr_photos` | Photo metadata linked to a specific report and project. Actual files live in Supabase Storage. |
| `materials` | Inventory master list — item name, current stock, unit, low-stock threshold. |
| `material_usage` | Log of material consumed on site. A database trigger auto-decrements `materials.current_stock` on insert. |
| `material_purchases` | Log of materials procured. A database trigger auto-increments `materials.current_stock` on insert. |
| `user_roles` | Defines the five RBAC roles: Admin, Project Manager, Site Engineer, Accountant, Viewer. |
| `user_project_assignments` | Junction table — maps a user to a project with a specific role. |
| `notifications` | Per-user notification inbox with read/unread status. |
| `project_stage_progress` | Tracks the completion percentage of each construction stage per project. |
| `floors` | Lookup table for floor names, replacing free-text fields in DPRs. |
| `stages` | Lookup table for construction stage names, replacing free-text fields. |
| `site_issues` | Field-reported site problems with AI-assigned categories (material delay, equipment failure, weather disruption, safety concern, other). |
| `labourer_attendance` | Daily headcount by labour category (unskilled, semi-skilled, skilled, supervisor) per project. |

---

## Key Design Decisions

### `total_cost` is a Generated Column

`daily_reports.total_cost` is defined as a `GENERATED ALWAYS AS (...) STORED` column in PostgreSQL. The database computes it from the five cost breakdown columns (labour, material, equipment, subcontractor, other) on every insert or update.

This means the total can never drift between the DPR form, the dashboard, and the financial reports — they all read the same database-computed value.

### Row Level Security — Evaluated Once Per Query

Every table has Row Level Security (RLS) enabled. All RLS policies use the following pattern:

```sql
(SELECT auth.uid()) = user_id
```

**Not** the naive form:

```sql
auth.uid() = user_id
```

The `SELECT` wrapper causes the function to be evaluated once per query, not once per row. On a table with thousands of DPR records, this is a significant performance difference.

### Stock Levels Are Maintained by Triggers

`materials.current_stock` is never updated directly by the application. Instead:
- An `AFTER INSERT` trigger on `material_usage` decrements stock.
- An `AFTER INSERT` trigger on `material_purchases` increments stock.

This makes the inventory self-healing — stale application state cannot corrupt stock levels.

### Role-Based Access

Roles are stored in `user_roles` and scoped to individual projects via `user_project_assignments`. This means the same user can be a Site Engineer on Project A and a Viewer on Project B.

The five roles and their access levels:

| Role | Can submit DPR | Can manage projects | Can view financials | Can manage users |
|------|:--------------:|:-------------------:|:-------------------:|:----------------:|
| Admin | ✓ | ✓ | ✓ | ✓ |
| Project Manager | ✓ | ✓ | ✓ | — |
| Site Engineer | ✓ | — | — | — |
| Accountant | — | — | ✓ | — |
| Viewer | — | — | — | — |
