# BuildTrack — Supabase Migrations

## Schema Overview

This directory contains **incremental migration files** applied on top of the baseline schema.

> **Important:** Migration files start at `006_` because migrations 001–005 were applied directly
> to the Supabase project dashboard before this `migrations/` folder was introduced.
> The baseline schema (tables, RLS policies, triggers, and storage buckets) is not represented
> as migration files — it was bootstrapped manually. This is documented here for clarity.

---

## Migration Files

| File | Description |
|------|-------------|
| `006_add_site_issues.sql` | Adds the `site_issues` table for logging field problems with AI classification categories and priority levels |
| `007_add_labourer_attendance.sql` | Adds the `labourer_attendance` table for daily headcount tracking by category (unskilled, skilled, supervisor) |
| `008_add_viewer_accountant_roles.sql` | Extends the RBAC system with `Viewer` and `Accountant` roles and their associated RLS policies |

---

## How to Apply Migrations

Run each file **in numeric order** against your Supabase project using the SQL editor:

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Paste and run each file in order: `006` → `007` → `008`

Or using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

---

## Core Tables (Baseline Schema)

The following tables exist in the database but are not represented as migration files:

| Table | Purpose |
|-------|---------|
| `projects` | Core project records with budget, GPS coordinates, and status |
| `daily_reports` | DPR submissions — `total_cost` is a `GENERATED ALWAYS` column |
| `dpr_photos` | Photo metadata linked to reports and projects via Supabase Storage |
| `materials` | Inventory master list with stock levels |
| `material_usage` | Usage log — auto-decrements `current_stock` via trigger |
| `material_purchases` | Procurement log — auto-increments `current_stock` via trigger |
| `user_roles` | RBAC role definitions |
| `user_project_assignments` | User ↔ Project ↔ Role junction table |
| `notifications` | Per-user notification inbox |
| `project_stage_progress` | Stage completion tracking per project |
| `floors` | Lookup table (replaces free-text floor entries) |
| `stages` | Lookup table (replaces free-text stage entries) |

---

## Development Seed Data

A development seed script is available at `supabase/seed/dev_seed.sql`.

> ⚠️ **Never run this in production.** It inserts dummy projects, materials, and issues
> assigned to the first registered user in `auth.users`.
