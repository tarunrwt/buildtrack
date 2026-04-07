-- ============================================================================
-- Migration 006: Site Issues with AI Classification
-- BuildTrack — Delay and Issue Logger
--
-- Tracks site delays and issues reported by engineers with AI-powered
-- classification into categories (material_delay, labour_shortage, etc.)
-- using the existing Groq/Llama endpoint for structured NLP classification.
-- ============================================================================

CREATE TABLE site_issues (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  reported_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  description     TEXT NOT NULL,

  -- AI-classified fields
  ai_category     TEXT NOT NULL DEFAULT 'uncategorized'
    CHECK (ai_category IN (
      'material_delay', 'labour_shortage', 'equipment_failure',
      'approval_pending', 'weather_disruption', 'safety_incident',
      'quality_issue', 'other', 'uncategorized'
    )),
  ai_confidence   TEXT DEFAULT NULL
    CHECK (ai_confidence IS NULL OR ai_confidence IN ('high', 'medium', 'low')),

  -- Priority and lifecycle
  priority        TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status          TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  resolution_date  DATE DEFAULT NULL,
  resolution_notes TEXT DEFAULT NULL,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE site_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all issues"
  ON site_issues FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert issues"
  ON site_issues FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update issues"
  ON site_issues FOR UPDATE TO authenticated
  USING (true);

-- ── Indexes for common query patterns ───────────────────────────────────────

CREATE INDEX idx_site_issues_project_date ON site_issues(project_id, reported_date DESC);
CREATE INDEX idx_site_issues_status       ON site_issues(status);
CREATE INDEX idx_site_issues_category     ON site_issues(ai_category);
CREATE INDEX idx_site_issues_priority     ON site_issues(priority);
