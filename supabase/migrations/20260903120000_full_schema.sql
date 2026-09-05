-- Full schema migration for Highlight app
-- Idempotent: can be run multiple times

-- 1. Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, birth_date TEXT DEFAULT '',
  role TEXT DEFAULT 'teacher', assigned_class_ids TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on teachers" ON teachers; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on teachers" ON teachers FOR ALL USING (true);

-- 2. Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
  mileage_cost INTEGER DEFAULT 0, inventory INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true, redemption_limit INTEGER DEFAULT 1,
  category TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on rewards" ON rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on rewards" ON rewards FOR ALL USING (true);

-- 3. Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL, student_name TEXT DEFAULT '',
  reward_id TEXT NOT NULL, reward_name TEXT DEFAULT '', mileage_cost INTEGER DEFAULT 0,
  status TEXT DEFAULT 'requested', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on redemptions" ON redemptions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on redemptions" ON redemptions FOR ALL USING (true);

-- 4. Badges
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT DEFAULT '',
  icon TEXT DEFAULT '', requirement_type TEXT DEFAULT '',
  requirement_value INTEGER DEFAULT 0, active BOOLEAN DEFAULT true,
  mileage_reward INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on badges" ON badges; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on badges" ON badges FOR ALL USING (true);

-- 5. Student badges
CREATE TABLE IF NOT EXISTS student_badges (
  student_id TEXT NOT NULL, badge_id TEXT NOT NULL,
  PRIMARY KEY (student_id, badge_id), awarded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE student_badges ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on student_badges" ON student_badges; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on student_badges" ON student_badges FOR ALL USING (true);

-- 6. Seasons
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, subtitle TEXT DEFAULT '',
  start_date TEXT DEFAULT '', end_date TEXT DEFAULT '',
  active BOOLEAN DEFAULT false, shared_goal_xp INTEGER DEFAULT 0,
  shared_reward TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on seasons" ON seasons; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on seasons" ON seasons FOR ALL USING (true);

-- 7. Settings
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
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on settings" ON settings; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true);

-- 8. Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, actor_id TEXT DEFAULT '', actor_role TEXT DEFAULT '',
  action TEXT DEFAULT '', target_type TEXT DEFAULT '', target_id TEXT DEFAULT '',
  description TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on audit_logs" ON audit_logs; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on audit_logs" ON audit_logs FOR ALL USING (true);

-- 9. Attendance sessions (may already exist)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id TEXT PRIMARY KEY, event_name TEXT DEFAULT '주일예배', date TEXT NOT NULL,
    start_time TEXT DEFAULT '10:00', end_time TEXT DEFAULT '12:00',
    active BOOLEAN DEFAULT false, mileage_reward INTEGER DEFAULT 20, xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on attendance_sessions" ON attendance_sessions; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on attendance_sessions" ON attendance_sessions FOR ALL USING (true);

-- 10. Attendance records (may already exist)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY, session_id TEXT, student_id TEXT, state TEXT DEFAULT 'absent',
    check_time TIMESTAMPTZ DEFAULT now(), method TEXT DEFAULT 'manual',
    UNIQUE(session_id, student_id)
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on attendance_records" ON attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on attendance_records" ON attendance_records FOR ALL USING (true);

-- 11. Community activities (may already exist)
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS community_activities (
    id TEXT PRIMARY KEY, type TEXT DEFAULT 'general', message TEXT DEFAULT '',
    student_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE community_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on community_activities" ON community_activities; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on community_activities" ON community_activities FOR ALL USING (true);

-- 12. Shared goal
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS shared_goal (
    id TEXT PRIMARY KEY DEFAULT 'default', label TEXT DEFAULT '',
    current_xp INTEGER DEFAULT 0, target_xp INTEGER DEFAULT 0,
    reward TEXT DEFAULT '', updated_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE shared_goal ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on shared_goal" ON shared_goal; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on shared_goal" ON shared_goal FOR ALL USING (true);

-- 13. Daily quests
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS daily_quests (
    id TEXT PRIMARY KEY, student_id TEXT NOT NULL, quest_id TEXT NOT NULL,
    completion_date TEXT NOT NULL, completed_at TIMESTAMPTZ DEFAULT now(),
    mileage_awarded INTEGER DEFAULT 0, xp_awarded INTEGER DEFAULT 0,
    UNIQUE(student_id, quest_id, completion_date)
  );
EXCEPTION WHEN OTHERS THEN NULL; END $$;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "Allow all on daily_quests" ON daily_quests; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "Allow all on daily_quests" ON daily_quests FOR ALL USING (true);
