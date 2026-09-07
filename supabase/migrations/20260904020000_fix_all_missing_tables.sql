-- ============================================================
-- Migration: Fix all missing tables and broken columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  target TEXT DEFAULT 'all',
  important BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  target_class_ids TEXT[] DEFAULT '{}',
  target_grades INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "announcements_all" ON announcements; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "announcements_all" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- 2. Create prayer_comments table
CREATE TABLE IF NOT EXISTS prayer_comments (
  id TEXT PRIMARY KEY,
  prayer_id TEXT NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "prayer_comments_all" ON prayer_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "prayer_comments_all" ON prayer_comments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer ON prayer_comments(prayer_id);

-- 3. Create student_badge_progress table
CREATE TABLE IF NOT EXISTS student_badge_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 0,
  current_progress INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);
ALTER TABLE student_badge_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sbp_all" ON student_badge_progress; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sbp_all" ON student_badge_progress FOR ALL USING (true) WITH CHECK (true);

-- 4. Create badge_levels table
CREATE TABLE IF NOT EXISTS badge_levels (
  id TEXT PRIMARY KEY,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  reward_mileage INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE badge_levels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "badge_levels_all" ON badge_levels; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "badge_levels_all" ON badge_levels FOR ALL USING (true) WITH CHECK (true);

-- 5. Create attendance_rewards table
CREATE TABLE IF NOT EXISTS attendance_rewards (
  id TEXT PRIMARY KEY,
  attendance_record_id TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount INTEGER DEFAULT 20,
  status TEXT DEFAULT 'awarded',
  reversed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE attendance_rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "attrew_all" ON attendance_rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "attrew_all" ON attendance_rewards FOR ALL USING (true) WITH CHECK (true);

-- 6. Add missing columns to completed_missions
DO $$ BEGIN
  ALTER TABLE completed_missions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 7. Add missing columns to missions
DO $$ BEGIN ALTER TABLE missions ADD COLUMN IF NOT EXISTS mileage_reward INTEGER DEFAULT 30; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE missions ADD COLUMN IF NOT EXISTS xp_reward INTEGER DEFAULT 30; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE missions ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE missions ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE missions ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT ''; EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- 8. Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mileage_cost INTEGER DEFAULT 0,
  inventory INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  redemption_limit INTEGER DEFAULT 1,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sp_all" ON store_products; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sp_all" ON store_products FOR ALL USING (true) WITH CHECK (true);

-- 9. Create store_requests table
CREATE TABLE IF NOT EXISTS store_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT DEFAULT '',
  product_id TEXT NOT NULL REFERENCES store_products(id),
  product_name TEXT DEFAULT '',
  mileage_cost INTEGER DEFAULT 0,
  status TEXT DEFAULT 'requested',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE store_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sr_all" ON store_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sr_all" ON store_requests FOR ALL USING (true) WITH CHECK (true);
