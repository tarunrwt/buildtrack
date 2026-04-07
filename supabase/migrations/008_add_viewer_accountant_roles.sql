-- ============================================================================
-- Migration 008: Add missing Viewer and Accountant roles to user_roles table
-- BuildTrack — Role Seed Data
--
-- The user_roles table was seeded without Viewer and Accountant entries.
-- This script is safe to run multiple times — it skips insertion if the 
-- role name already exists.
-- ============================================================================

-- Add Viewer role (safe — skips if already exists)
INSERT INTO user_roles (name, description, permissions)
SELECT
  'Viewer',
  'Read-only access to dashboards, projects, and reports. Cannot submit DPRs, raise issues, or modify any data.',
  '["view_dashboard", "view_projects", "view_reports", "view_financials"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE name = 'Viewer'
);

-- Add Accountant role (safe — skips if already exists)
INSERT INTO user_roles (name, description, permissions)
SELECT
  'Accountant',
  'Manages project financials, budgets, materials, and labour costs. Cannot submit DPRs or raise site issues.',
  '["view_dashboard", "view_projects", "view_reports", "view_financials", "manage_financials", "view_materials", "view_labour"]'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles WHERE name = 'Accountant'
);
