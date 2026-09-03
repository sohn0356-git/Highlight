-- ============================================================
-- Highlight App - Full Schema Upgrade
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE students ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS weekly_xp INT DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_teacher BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS grade INT DEFAULT 1;
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone TEXT DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS memo TEXT DEFAULT '';
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'active';

-- 2. Add missing columns to missions table
ALTER TABLE missions ADD COLUMN IF NOT EXISTS mileage_reward INT DEFAULT 30;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 30;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS start_date TEXT DEFAULT '';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS end_date TEXT DEFAULT '';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT FALSE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add missing columns to completed_missions
ALTER TABLE completed_missions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
ALTER TABLE completed_missions ADD COLUMN IF NOT EXISTS reviewed_by TEXT DEFAULT '';
ALTER TABLE completed_missions ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE completed_missions ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';

-- 4. Create badge_levels table
CREATE TABLE IF NOT EXISTS badge_levels (
  id TEXT PRIMARY KEY,
  badge_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  threshold INTEGER DEFAULT 0,
  reward_mileage INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(badge_id, level)
);
ALTER TABLE badge_levels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "badge_levels_all" ON badge_levels; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "badge_levels_all" ON badge_levels FOR ALL USING (true) WITH CHECK (true);

-- 5. Create student_badge_progress table
CREATE TABLE IF NOT EXISTS student_badge_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  current_level INTEGER DEFAULT 0,
  current_progress INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_id)
);
ALTER TABLE student_badge_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sbp_all" ON student_badge_progress; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sbp_all" ON student_badge_progress FOR ALL USING (true) WITH CHECK (true);

-- 6. Create attendance_rewards table
CREATE TABLE IF NOT EXISTS attendance_rewards (
  id TEXT PRIMARY KEY,
  attendance_record_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  amount INTEGER DEFAULT 20,
  status TEXT DEFAULT 'awarded',
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  reversed_at TIMESTAMPTZ,
  UNIQUE(attendance_record_id, student_id)
);
ALTER TABLE attendance_rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "attrew_all" ON attendance_rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "attrew_all" ON attendance_rewards FOR ALL USING (true) WITH CHECK (true);

-- 7. Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  important BOOLEAN DEFAULT FALSE,
  target TEXT DEFAULT 'all',
  target_class_ids TEXT[] DEFAULT '{}',
  target_grades INT[] DEFAULT '{}',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "announcements_all" ON announcements; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "announcements_all" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- 8. Create store_products table
CREATE TABLE IF NOT EXISTS store_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mileage_cost INT DEFAULT 0,
  inventory INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  redemption_limit INT DEFAULT 1,
  category TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sp_all" ON store_products; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sp_all" ON store_products FOR ALL USING (true) WITH CHECK (true);

-- 9. Create store_requests table
CREATE TABLE IF NOT EXISTS store_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  product_id TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  mileage_cost INT DEFAULT 0,
  status TEXT DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT DEFAULT ''
);
ALTER TABLE store_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sr_all" ON store_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sr_all" ON store_requests FOR ALL USING (true) WITH CHECK (true);

-- 10. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT DEFAULT '',
  actor_role TEXT DEFAULT '',
  action TEXT DEFAULT '',
  target_type TEXT DEFAULT '',
  target_id TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "al_all" ON audit_logs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "al_all" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 11. Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_attendance_mileage INT DEFAULT 20,
  default_qt_mileage INT DEFAULT 20,
  prayer_mileage INT DEFAULT 5,
  weekly_mission_reward INT DEFAULT 30,
  name_display_policy TEXT DEFAULT 'full',
  anonymous_prayer_enabled BOOLEAN DEFAULT TRUE,
  mileage_shop_enabled BOOLEAN DEFAULT TRUE
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "settings_all" ON settings; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "settings_all" ON settings FOR ALL USING (true) WITH CHECK (true);

-- 12. Create rewards table (store items)
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mileage_cost INT DEFAULT 0,
  inventory INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  redemption_limit INT DEFAULT 1,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "rewards_all" ON rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "rewards_all" ON rewards FOR ALL USING (true) WITH CHECK (true);

-- 13. Create redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  reward_id TEXT NOT NULL,
  reward_name TEXT DEFAULT '',
  mileage_cost INT DEFAULT 0,
  status TEXT DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "redemptions_all" ON redemptions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "redemptions_all" ON redemptions FOR ALL USING (true) WITH CHECK (true);

-- 14. Create a proper rewards table as alias for store_products
-- (rewards = store_products essentially)

-- 15. Add grade column to classes if missing
ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade INT DEFAULT 1;

-- 16. Seed badges (6 badge types)
INSERT INTO badges (id, icon, name, description, criteria, progress, unlocked, active, requirement_type, display_order, level_thresholds) VALUES
  ('b1', '📖', '말씀 탐험가', 'QT 완료 횟수에 따라 레벨업', 1, 0, false, true, 'qt_count', 1, '{1,7,15,31,100}'),
  ('b2', '⛪', '예배자', '예배 출석 횟수에 따라 레벨업', 1, 0, false, true, 'attendance_count', 2, '{1,8,20,35,50}'),
  ('b3', '🙏', '중보 기도자', '기도 참여 횟수에 따라 레벨업', 1, 0, false, true, 'prayer_count', 3, '{1,5,15,30,60}'),
  ('b4', '🏆', '미션 정복자', '미션 완료 횟수에 따라 레벨업', 1, 0, false, true, 'mission_count', 4, '{1,5,10,20,40}'),
  ('b5', '💎', '마일리지 수집가', '마일리지 누적 획득에 따라 레벨업', 1, 0, false, true, 'mileage_total', 5, '{50,200,500,1000,3000}'),
  ('b6', '🔥', 'XP 마스터', 'XP 누적 획득에 따라 레벨업', 1, 0, false, true, 'xp_total', 6, '{100,500,1000,3000,5000}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  requirement_type = EXCLUDED.requirement_type, level_thresholds = EXCLUDED.level_thresholds,
  active = EXCLUDED.active, display_order = EXCLUDED.display_order;

-- 17. Seed badge levels for all 6 badges
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  -- 말씀 탐험가 (QT)
  ('bl_b1_1','b1',1,1,10,10,'말씀 입문','QT 1회 완료'),
  ('bl_b1_2','b1',2,7,20,20,'말씀 탐험가','QT 7회 완료'),
  ('bl_b1_3','b1',3,15,30,30,'말씀 구도자','QT 15회 완료'),
  ('bl_b1_4','b1',4,31,50,50,'말씀 열정가','QT 31회 완료'),
  ('bl_b1_5','b1',5,100,100,100,'말씀 마스터','QT 100회 완료'),
  -- 예배자 (출석)
  ('bl_b2_1','b2',1,1,10,10,'첫 출석','예배 1회 참석'),
  ('bl_b2_2','b2',2,8,20,20,'꾸준한 예배자','예배 8회 참석'),
  ('bl_b2_3','b2',3,20,30,30,'헌신한 예배자','예배 20회 참석'),
  ('bl_b2_4','b2',4,35,50,50,'정기 예배자','예배 35회 참석'),
  ('bl_b2_5','b2',5,50,100,100,'예배 마스터','예배 50회 참석'),
  -- 중보 기도자 (기도)
  ('bl_b3_1','b3',1,1,10,10,'기도 시작','기도 1회 참여'),
  ('bl_b3_2','b3',2,5,20,20,'기도 동참자','기도 5회 참여'),
  ('bl_b3_3','b3',3,15,30,30,'기도 중보자','기도 15회 참여'),
  ('bl_b3_4','b3',4,30,50,50,'기도 용사','기도 30회 참여'),
  ('bl_b3_5','b3',5,60,100,100,'기도 마스터','기도 60회 참여'),
  -- 미션 정복자
  ('bl_b4_1','b4',1,1,10,10,'미션 입문','미션 1회 완료'),
  ('bl_b4_2','b4',2,5,20,20,'미션 수행자','미션 5회 완료'),
  ('bl_b4_3','b4',3,10,30,30,'미션 헌신자','미션 10회 완료'),
  ('bl_b4_4','b4',4,20,50,50,'미션 정복자','미션 20회 완료'),
  ('bl_b4_5','b4',5,40,100,100,'미션 마스터','미션 40회 완료'),
  -- 마일리지 수집가
  ('bl_b5_1','b5',1,50,10,10,'마일리지 입문','마일리지 50M 획득'),
  ('bl_b5_2','b5',2,200,20,20,'마일리지 모험가','마일리지 200M 획득'),
  ('bl_b5_3','b5',3,500,30,30,'마일리지 수집가','마일리지 500M 획득'),
  ('bl_b5_4','b5',4,1000,50,50,'마일리지 갑부','마일리지 1000M 획득'),
  ('bl_b5_5','b5',5,3000,100,100,'마일리지 마스터','마일리지 3000M 획득'),
  -- XP 마스터
  ('bl_b6_1','b6',1,100,10,10,'XP 입문','XP 100 획득'),
  ('bl_b6_2','b6',2,500,20,20,'XP 모험가','XP 500 획득'),
  ('bl_b6_3','b6',3,1000,30,30,'XP 전사','XP 1000 획득'),
  ('bl_b6_4','b6',4,3000,50,50,'XP 영웅','XP 3000 획득'),
  ('bl_b6_5','b6',5,5000,100,100,'XP 마스터','XP 5000 획득')
ON CONFLICT (id) DO UPDATE SET
  threshold = EXCLUDED.threshold, reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp, title = EXCLUDED.title, description = EXCLUDED.description;

-- 18. Set Son Gyeongju as admin
UPDATE teachers SET role = 'admin' WHERE name = '손경주' OR id = 't8';
UPDATE students SET role = 'admin', is_teacher = true WHERE name = '손경주' OR id = 'admin_son';

-- 19. Add birth_date column check (already exists)
-- students.birth_date already exists

-- 20. Ensure attendance_records has the right columns
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT '';
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';

-- 21. Ensure attendance_sessions has the right columns
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS event_name TEXT DEFAULT '주일예배';
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS start_time TEXT DEFAULT '10:00';
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS end_time TEXT DEFAULT '12:00';
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS mileage_reward INT DEFAULT 20;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS xp_reward INT DEFAULT 20;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT '';

-- 22. Add attendance_records unique constraint if missing
DO $$ BEGIN
  ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_session_student UNIQUE (session_id, student_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 23. Create indexes
CREATE INDEX IF NOT EXISTS idx_mileage_tx_student ON mileage_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_mileage_tx_date ON mileage_transactions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_qt_records_student ON qt_records(student_id);
CREATE INDEX IF NOT EXISTS idx_qt_records_date ON qt_records(date);
CREATE INDEX IF NOT EXISTS idx_student_badge_progress_student ON student_badge_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_badge_levels_badge ON badge_levels(badge_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rewards_record ON attendance_rewards(attendance_record_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_student_date ON daily_quests(student_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(active);

-- 24. Set student grade from class_id
UPDATE students SET grade = CASE
  WHEN class_id LIKE 'c_g1_%' THEN 1
  WHEN class_id LIKE 'c_g2_%' THEN 2
  WHEN class_id LIKE 'c_g3_%' THEN 3
  ELSE 1
END WHERE grade IS NULL OR grade = 0;

-- 25. Set student class_name from classes
UPDATE students s SET class_name = c.name FROM classes c WHERE s.class_id = c.id;

-- 26. Ensure all students are active
UPDATE students SET active = TRUE WHERE active IS NULL;

-- Done!
