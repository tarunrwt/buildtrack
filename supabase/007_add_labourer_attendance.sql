-- ============================================================================
-- Migration 007: Per-Person Labour Attendance System
-- ============================================================================
-- Adds individual labourer registration and daily per-person attendance
-- tracking. Complements the existing bulk `labour_attendance` table.
--
-- Tables:
--   1. labourers            — Master register of individual workers
--   2. labourer_attendance  — Daily attendance per person
--
-- Storage:
--   Creates a public bucket 'labourer-photos' for worker profile photos.
-- ============================================================================

-- ── 1. Labourers Master Table ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS labourers (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id      uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name            text NOT NULL,
  phone           text,
  category        text NOT NULL DEFAULT 'unskilled'
                    CHECK (category IN ('unskilled', 'semi_skilled', 'skilled', 'highly_skilled')),
  trade           text,
  daily_wage_rate numeric NOT NULL DEFAULT 380,
  aadhaar_last4   text CHECK (aadhaar_last4 IS NULL OR length(aadhaar_last4) = 4),
  photo_url       text,
  is_active       boolean NOT NULL DEFAULT true,
  joined_date     date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 2. Per-Person Daily Attendance ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS labourer_attendance (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  labourer_id      uuid REFERENCES labourers(id) ON DELETE CASCADE NOT NULL,
  project_id       uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  attendance_date  date NOT NULL DEFAULT CURRENT_DATE,
  status           text NOT NULL DEFAULT 'present'
                     CHECK (status IN ('present', 'absent', 'half_day')),
  hours_worked     numeric NOT NULL DEFAULT 8,
  wage_earned      numeric NOT NULL DEFAULT 0,
  marked_by        uuid REFERENCES auth.users(id),
  remarks          text,
  created_at       timestamptz NOT NULL DEFAULT now(),

  -- One entry per person per day
  UNIQUE (labourer_id, attendance_date)
);

-- ── 3. Indexes for Performance ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_labourers_project
  ON labourers(project_id);

CREATE INDEX IF NOT EXISTS idx_labourers_active
  ON labourers(project_id, is_active);

CREATE INDEX IF NOT EXISTS idx_labourer_attendance_date
  ON labourer_attendance(project_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_labourer_attendance_worker
  ON labourer_attendance(labourer_id, attendance_date);

-- ── 4. Row Level Security ────────────────────────────────────────────────────

ALTER TABLE labourers ENABLE ROW LEVEL SECURITY;
ALTER TABLE labourer_attendance ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view and manage labourers
CREATE POLICY "Authenticated users can view labourers"
  ON labourers FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert labourers"
  ON labourers FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update labourers"
  ON labourers FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Attendance policies
CREATE POLICY "Authenticated users can view attendance"
  ON labourer_attendance FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can mark attendance"
  ON labourer_attendance FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance"
  ON labourer_attendance FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ── 5. Storage Bucket for Labourer Photos ────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('labourer-photos', 'labourer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload labourer photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'labourer-photos');

CREATE POLICY "Anyone can view labourer photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'labourer-photos');

CREATE POLICY "Authenticated users can update labourer photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'labourer-photos');
