-- ============================================================
-- Highlight App - Production Database Schema
-- All tables use RLS with open policies (anon key access)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 0. XP & Mileage ledger tables (must exist first for FK)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT '',
  source_type TEXT DEFAULT '',
  source_id TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "xp_tx_all" ON xp_transactions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "xp_tx_all" ON xp_transactions FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS mileage_transactions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  class_name TEXT DEFAULT '',
  type TEXT DEFAULT '',
  description TEXT DEFAULT '',
  amount INTEGER DEFAULT 0,
  date TEXT DEFAULT '',
  actor_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE mileage_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "mileage_tx_all" ON mileage_transactions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "mileage_tx_all" ON mileage_transactions FOR ALL USING (true);

-- 1. Classes (공동목표)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  attendance_attended INTEGER DEFAULT 0,
  attendance_total INTEGER DEFAULT 0,
  qt_count INTEGER DEFAULT 0,
  mission_count INTEGER DEFAULT 0,
  prayer_count INTEGER DEFAULT 0,
  class_message TEXT DEFAULT '',
  grade INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "classes_all" ON classes; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "classes_all" ON classes FOR ALL USING (true);

-- 2. Students (예수원)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT DEFAULT '',
  class_id TEXT DEFAULT '',
  mileage INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  is_teacher BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'student',
  assigned_class_ids TEXT[] DEFAULT '{}',
  phone TEXT DEFAULT '',
  guardian_phone TEXT DEFAULT '',
  memo TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  enrollment_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "students_all" ON students; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "students_all" ON students FOR ALL USING (true);

-- 3. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT DEFAULT '',
  role TEXT DEFAULT 'teacher',
  assigned_class_ids TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "teachers_all" ON teachers; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "teachers_all" ON teachers FOR ALL USING (true);

-- 4. QT today (오늘의 말씀)
CREATE TABLE IF NOT EXISTS qt_today (
  id TEXT PRIMARY KEY DEFAULT 'default',
  date TEXT NOT NULL,
  passage TEXT DEFAULT '',
  verse TEXT DEFAULT '',
  content TEXT DEFAULT '',
  prayer TEXT DEFAULT '',
  song TEXT DEFAULT '',
  helper TEXT DEFAULT '',
  question1 TEXT DEFAULT '',
  question2 TEXT DEFAULT '',
  title TEXT DEFAULT '',
  mileage_reward INTEGER DEFAULT 20,
  xp_reward INTEGER DEFAULT 20,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE qt_today ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "qt_today_all" ON qt_today; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "qt_today_all" ON qt_today FOR ALL USING (true);

-- 5. QT records (_students' QT completions)
CREATE TABLE IF NOT EXISTS qt_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  passage TEXT DEFAULT '',
  verse TEXT DEFAULT '',
  remembered TEXT DEFAULT '',
  application TEXT DEFAULT '',
  reward INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE qt_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "qt_records_all" ON qt_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "qt_records_all" ON qt_records FOR ALL USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS qt_records_student_date_idx ON qt_records (student_id, date);

-- 6. Missions
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🎯',
  type TEXT DEFAULT 'weekly',
  mileage_reward INTEGER DEFAULT 30,
  xp_reward INTEGER DEFAULT 30,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  target TEXT DEFAULT 'all',
  target_class_ids TEXT[] DEFAULT '{}',
  approval_required BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "missions_all" ON missions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "missions_all" ON missions FOR ALL USING (true);

-- 7. Completed missions
CREATE TABLE IF NOT EXISTS completed_missions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ DEFAULT '',
  reviewer_id TEXT DEFAULT '',
  rejection_reason TEXT DEFAULT ''
);
ALTER TABLE completed_missions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "completed_missions_all" ON completed_missions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "completed_missions_all" ON completed_missions FOR ALL USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS completed_missions_unique_idx ON completed_missions (mission_id, student_id);

-- 8. Prayer requests
CREATE TABLE IF NOT EXISTS prayer_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  author_name TEXT DEFAULT '',
  anonymous BOOLEAN DEFAULT false,
  content TEXT DEFAULT '',
  prayer_count INTEGER DEFAULT 0,
  class_id TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "prayer_requests_all" ON prayer_requests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "prayer_requests_all" ON prayer_requests FOR ALL USING (true);

-- 9. Prayer participants
CREATE TABLE IF NOT EXISTS prayer_participants (
  id TEXT PRIMARY KEY DEFAULT ('pp_' || now()::text || '_' || random()::text),
  prayer_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  prayed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE prayer_participants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "prayer_participants_all" ON prayer_participants; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "prayer_participants_all" ON prayer_participants FOR ALL USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS prayer_participants_unique_idx ON prayer_participants (prayer_id, student_id);

-- 10. Daily quests
CREATE TABLE IF NOT EXISTS daily_quests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  completion_date TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  mileage_awarded INTEGER DEFAULT 0,
  xp_awarded INTEGER DEFAULT 0
);
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "daily_quests_all" ON daily_quests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "daily_quests_all" ON daily_quests FOR ALL USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS daily_quests_unique_idx ON daily_quests (student_id, quest_id, completion_date);

-- 11. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  target TEXT DEFAULT 'all',
  target_class_ids TEXT[] DEFAULT '{}',
  target_grades TEXT[] DEFAULT '{}',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  important BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "announcements_all" ON announcements; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "announcements_all" ON announcements FOR ALL USING (true);

-- 12. Rewards (상점)
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  mileage_cost INTEGER DEFAULT 0,
  inventory INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  redemption_limit INTEGER DEFAULT 1,
  category TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "rewards_all" ON rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "rewards_all" ON rewards FOR ALL USING (true);

-- 13. Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  reward_id TEXT NOT NULL,
  reward_name TEXT DEFAULT '',
  mileage_cost INTEGER DEFAULT 0,
  status TEXT DEFAULT 'requested',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "redemptions_all" ON redemptions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "redemptions_all" ON redemptions FOR ALL USING (true);

-- 14. Badges
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  requirement_type TEXT DEFAULT '',
  requirement_value INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  mileage_reward INTEGER DEFAULT 0,
  category TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0,
  level_thresholds INTEGER[] DEFAULT '{10,30,60,100,200}',
  level_labels TEXT[] DEFAULT '{Lv.1,Lv.2,Lv.3,Lv.4,Lv.5}',
  level_rewards INTEGER[] DEFAULT '{10,20,30,50,100}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "badges_all" ON badges; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "badges_all" ON badges FOR ALL USING (true);

-- 15. Student badges
CREATE TABLE IF NOT EXISTS student_badges (
  id TEXT PRIMARY KEY DEFAULT ('sb_' || now()::text || '_' || random()::text),
  student_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  current_level INTEGER DEFAULT 0,
  current_progress INTEGER DEFAULT 0,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "student_badges_all" ON student_badges; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "student_badges_all" ON student_badges FOR ALL USING (true);
CREATE UNIQUE INDEX IF NOT EXISTS student_badges_unique_idx ON student_badges (student_id, badge_id);

-- 16. Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  active BOOLEAN DEFAULT false,
  shared_goal_xp INTEGER DEFAULT 0,
  shared_reward TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "seasons_all" ON seasons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "seasons_all" ON seasons FOR ALL USING (true);

-- 17. Settings
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_attendance_mileage INTEGER DEFAULT 20,
  default_qt_mileage INTEGER DEFAULT 20,
  prayer_mileage INTEGER DEFAULT 5,
  weekly_mission_reward INTEGER DEFAULT 30,
  name_display_policy TEXT DEFAULT 'full',
  anonymous_prayer_enabled BOOLEAN DEFAULT true,
  mileage_shop_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "settings_all" ON settings; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "settings_all" ON settings FOR ALL USING (true);

-- 18. Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_id TEXT DEFAULT '',
  actor_role TEXT DEFAULT '',
  action TEXT DEFAULT '',
  target_type TEXT DEFAULT '',
  target_id TEXT DEFAULT '',
  description TEXT DEFAULT '',
  before_data TEXT DEFAULT '',
  after_data TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL USING (true);

-- 19. Attendance sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  event_name TEXT DEFAULT '주일예배',
  date TEXT NOT NULL,
  start_time TEXT DEFAULT '10:00',
  end_time TEXT DEFAULT '12:00',
  active BOOLEAN DEFAULT false,
  mileage_reward INTEGER DEFAULT 20,
  xp_reward INTEGER DEFAULT 20,
  created_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "attendance_sessions_all" ON attendance_sessions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "attendance_sessions_all" ON attendance_sessions FOR ALL USING (true);

-- 20. Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  student_id TEXT,
  state TEXT DEFAULT 'absent',
  check_time TIMESTAMPTZ DEFAULT now(),
  method TEXT DEFAULT 'manual',
  previous_state TEXT DEFAULT '',
  changed_by TEXT DEFAULT '',
  changed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, student_id)
);
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "attendance_records_all" ON attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "attendance_records_all" ON attendance_records FOR ALL USING (true);

-- 21. Community activities
CREATE TABLE IF NOT EXISTS community_activities (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'general',
  message TEXT DEFAULT '',
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE community_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "community_activities_all" ON community_activities; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "community_activities_all" ON community_activities FOR ALL USING (true);

-- 22. Shared goal
CREATE TABLE IF NOT EXISTS shared_goal (
  id TEXT PRIMARY KEY DEFAULT 'default',
  label TEXT DEFAULT '',
  current_xp INTEGER DEFAULT 0,
  target_xp INTEGER DEFAULT 0,
  reward TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE shared_goal ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "shared_goal_all" ON shared_goal; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "shared_goal_all" ON shared_goal FOR ALL USING (true);

-- 23. Shared QT posts
CREATE TABLE IF NOT EXISTS shared_qt_posts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  class_id TEXT DEFAULT '',
  class_name TEXT DEFAULT '',
  passage TEXT DEFAULT '',
  verse TEXT DEFAULT '',
  remembered TEXT DEFAULT '',
  application TEXT DEFAULT '',
  reward INTEGER DEFAULT 0,
  date TEXT DEFAULT '',
  comment_count INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE shared_qt_posts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "shared_qt_posts_all" ON shared_qt_posts; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "shared_qt_posts_all" ON shared_qt_posts FOR ALL USING (true);

-- 24. QT comments
CREATE TABLE IF NOT EXISTS qt_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE qt_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "qt_comments_all" ON qt_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "qt_comments_all" ON qt_comments FOR ALL USING (true);

-- 25. Student levels (calculated from XP)
CREATE TABLE IF NOT EXISTS student_levels (
  id TEXT PRIMARY KEY DEFAULT 'default',
  current_level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE student_levels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "student_levels_all" ON student_levels; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "student_levels_all" ON student_levels FOR ALL USING (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default settings
INSERT INTO settings (id, default_attendance_mileage, default_qt_mileage, prayer_mileage, weekly_mission_reward, name_display_policy, anonymous_prayer_enabled, mileage_shop_enabled)
VALUES ('default', 20, 20, 5, 30, 'full', true, true)
ON CONFLICT (id) DO NOTHING;

-- Default shared goal
INSERT INTO shared_goal (id, label, current_xp, target_xp, reward)
VALUES ('default', '2026 하반기 말씀탐험', 0, 50000, '전체 피크닉')
ON CONFLICT (id) DO NOTHING;

-- Default season
INSERT INTO seasons (id, name, subtitle, start_date, end_date, active, shared_goal_xp, shared_reward)
VALUES ('s2026h2', '2026 하반기 시즌', '말씀과 함께하는 여정', '2026-09-01', '2026-12-31', true, 50000, '전체 피크닉')
ON CONFLICT (id) DO NOTHING;

-- Badges with level thresholds
INSERT INTO badges (id, name, description, icon, requirement_type, requirement_value, active, mileage_reward, category, display_order, level_thresholds, level_labels, level_rewards)
VALUES
  ('b1', '말씀탐험가', 'QT를 완료하세요', '📖', 'qt_count', 10, true, 10, 'qt', 1, '{10,30,60,100,200}', '{Lv.1,Lv.2,Lv.3,Lv.4,Lv.MAX}', '{10,20,30,50,100}'),
  ('b2', '기도열정', '기도에 참여하세요', '🙏', 'prayer_count', 5, true, 10, 'prayer', 2, '{5,15,30,50,100}', '{Lv.1,Lv.2,Lv.3,Lv.4,Lv.MAX}', '{10,20,30,50,100}'),
  ('b3', '미션헌신', '미션을 완료하세요', '🎯', 'mission_count', 3, true, 10, 'mission', 3, '{3,8,15,25,50}', '{Lv.1,Lv.2,Lv.3,Lv.4,Lv.MAX}', '{10,20,30,50,100}'),
  ('b4', '출석성실', '출석하세요', '✅', 'attendance_count', 10, true, 10, 'attendance', 4, '{10,25,50,100,200}', '{Lv.1,Lv.2,Lv.3,Lv.4,Lv.MAX}', '{10,20,30,50,100}'),
  ('b5', '마일리지collector', '마일리지를 모으세요', '💰', 'mileage_earned', 100, true, 10, 'mileage', 5, '{100,500,1000,3000,5000}', '{Lv.1,Lv.2,Lv.3,Lv.4,Lv.MAX}', '{10,20,30,50,100}')
ON CONFLICT (id) DO NOTHING;

-- Demo missions
INSERT INTO missions (id, title, description, icon, type, mileage_reward, xp_reward, start_date, end_date, target, active)
VALUES
  ('m1', 'QT 나누기', ' QT를 친구와 공유하세요', '📖', 'weekly', 30, 30, '2026-09-01', '2026-09-07', 'all', true),
  ('m2', '기도 메모 작성', '기도제목을 올려보세요', '🙏', 'weekly', 20, 20, '2026-09-01', '2026-09-07', 'all', true),
  ('m3', '말씀 필사', '오늘의 말씀을 필사하세요', '✍️', 'weekly', 25, 25, '2026-09-01', '2026-09-07', 'all', true),
  ('m4', '친구 초대', '친구를 Highlight에 초대하세요', '👥', 'special', 100, 100, '2026-09-01', '2026-12-31', 'all', true),
  ('m5', '출석 스타트', '첫 주일 출석을 하세요', '🏁', 'weekly', 10, 10, '2026-09-01', '2026-09-07', 'all', true),
  ('m6', '묵상노트 작성', 'QT 묵상을 작성하세요', '📝', 'weekly', 15, 15, '2026-09-01', '2026-09-07', 'all', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Update students table to include xp column if not exists
-- ============================================================
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS weekly_xp INTEGER DEFAULT 0;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_phone TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS memo TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_status TEXT DEFAULT 'active';
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE students ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Add grade column to classes if not exists
DO $$ BEGIN
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS grade INTEGER DEFAULT 1;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
