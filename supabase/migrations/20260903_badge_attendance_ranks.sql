-- ============================================================
-- Migration: Badge levels, attendance rewards, student cleanup, admin fix
-- ============================================================

-- 1. Badge levels table (multi-level badge configuration)
CREATE TABLE IF NOT EXISTS badge_levels (
  id TEXT PRIMARY KEY,
  badge_id TEXT NOT NULL,
  level INTEGER NOT NULL,
  threshold INTEGER NOT NULL DEFAULT 0,
  reward_mileage INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(badge_id, level)
);
ALTER TABLE badge_levels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "badge_levels_all" ON badge_levels; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "badge_levels_all" ON badge_levels FOR ALL USING (true);

-- 2. Student badge progress table
CREATE TABLE IF NOT EXISTS student_badge_progress (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  current_level INTEGER DEFAULT 0,
  current_progress INTEGER DEFAULT 0,
  last_reward_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, badge_id)
);
ALTER TABLE student_badge_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sbp_all" ON student_badge_progress; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sbp_all" ON student_badge_progress FOR ALL USING (true);

-- 3. Attendance rewards tracking (idempotency)
CREATE TABLE IF NOT EXISTS attendance_rewards (
  id TEXT PRIMARY KEY,
  attendance_record_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  amount INTEGER DEFAULT 20,
  status TEXT DEFAULT 'awarded',
  awarded_at TIMESTAMPTZ DEFAULT now(),
  reversed_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(attendance_record_id, student_id)
);
ALTER TABLE attendance_rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "attrew_all" ON attendance_rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "attrew_all" ON attendance_rewards FOR ALL USING (true);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mileage_tx_student ON mileage_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_mileage_tx_date ON mileage_transactions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_qt_records_student ON qt_records(student_id);
CREATE INDEX IF NOT EXISTS idx_qt_records_date ON qt_records(date);
CREATE INDEX IF NOT EXISTS idx_student_badge_progress_student ON student_badge_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_badge_levels_badge ON badge_levels(badge_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rewards_record ON attendance_rewards(attendance_record_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_student_date ON daily_quests(student_id, completion_date);
-- 4-1. Ensure required columns exist before creating indexes
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
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 4-2. Fill grade / class_name from class_id (idempotent)
UPDATE students SET grade = CASE
  WHEN class_id LIKE 'c_g1_%' THEN 1
  WHEN class_id LIKE 'c_g2_%' THEN 2
  WHEN class_id LIKE 'c_g3_%' THEN 3
  ELSE 1
END WHERE grade IS NULL OR grade = 0;
UPDATE students s SET class_name = c.name FROM classes c
  WHERE s.class_id = c.id AND (s.class_name IS NULL OR s.class_name = '');

CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(active);

-- 5. Upsert Son Gyeongju as admin (idempotent)
INSERT INTO teachers (id, name, birth_date, role, assigned_class_ids, active)
VALUES ('admin_son', '손경주', '1994-02-28', 'admin', '{}', true)
ON CONFLICT (id) DO UPDATE SET role = 'admin', active = true;

-- Also ensure they exist in students table as admin for login
INSERT INTO students (id, name, birth_date, class_id, role, is_teacher, active, mileage, xp)
VALUES ('admin_son', '손경주', '1994-02-28', '', 'admin', true, true, 0, 0)
ON CONFLICT (id) DO UPDATE SET role = 'admin', is_teacher = true, active = true;

-- 6. Seed badge levels for each badge category
-- QT Devotional badge (b1)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b1_1', 'b1', 1, 1, 10, 10, '말씀 입문', 'QT 1회 완료'),
  ('bl_b1_2', 'b1', 2, 7, 20, 20, '말씀 탐험가', 'QT 7회 완료'),
  ('bl_b1_3', 'b1', 3, 15, 30, 30, '말씀 구도자', 'QT 15회 완료'),
  ('bl_b1_4', 'b1', 4, 31, 50, 50, '말씀 열정가', 'QT 31회 완료'),
  ('bl_b1_5', 'b1', 5, 100, 100, 100, '말씀 마스터', 'QT 100회 완료')
ON CONFLICT (id) DO NOTHING;

-- Prayer badge (b2)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b2_1', 'b2', 1, 1, 10, 10, '기도 시작', '기도 1회 참여'),
  ('bl_b2_2', 'b2', 2, 5, 20, 20, '기도 동참자', '기도 5회 참여'),
  ('bl_b2_3', 'b2', 3, 15, 30, 30, '기도 중보자', '기도 15회 참여'),
  ('bl_b2_4', 'b2', 4, 30, 50, 50, '기도 용사', '기도 30회 참여'),
  ('bl_b2_5', 'b2', 5, 60, 100, 100, '기도 마스터', '기도 60회 참여')
ON CONFLICT (id) DO NOTHING;

-- Mission badge (b3)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b3_1', 'b3', 1, 1, 10, 10, '미션 입문', '미션 1회 완료'),
  ('bl_b3_2', 'b3', 2, 5, 20, 20, '미션 수행자', '미션 5회 완료'),
  ('bl_b3_3', 'b3', 3, 10, 30, 30, '미션 헌신자', '미션 10회 완료'),
  ('bl_b3_4', 'b3', 4, 20, 50, 50, '미션 정복자', '미션 20회 완료'),
  ('bl_b3_5', 'b3', 5, 40, 100, 100, '미션 마스터', '미션 40회 완료')
ON CONFLICT (id) DO NOTHING;

-- Attendance badge (b4)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b4_1', 'b4', 1, 1, 10, 10, '첫 출석', '출석 1회'),
  ('bl_b4_2', 'b4', 2, 8, 20, 20, '꾸준한 출석', '출석 8회'),
  ('bl_b4_3', 'b4', 3, 20, 30, 30, '성실한 출석', '출석 20회'),
  ('bl_b4_4', 'b4', 4, 35, 50, 50, '헌신한 출석', '출석 35회'),
  ('bl_b4_5', 'b4', 5, 50, 100, 100, '출석 마스터', '출석 50회')
ON CONFLICT (id) DO NOTHING;

-- Mileage collector badge (b5)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b5_1', 'b5', 1, 50, 10, 10, '마일리지 입문', '마일리지 50M 획득'),
  ('bl_b5_2', 'b5', 2, 200, 20, 20, '마일리지 모험가', '마일리지 200M 획득'),
  ('bl_b5_3', 'b5', 3, 500, 30, 30, '마일리지 수집가', '마일리지 500M 획득'),
  ('bl_b5_4', 'b5', 4, 1000, 50, 50, '마일리지 갑부', '마일리지 1000M 획득'),
  ('bl_b5_5', 'b5', 5, 3000, 100, 100, '마일리지 마스터', '마일리지 3000M 획득')
ON CONFLICT (id) DO NOTHING;

-- XP earner badge (new)
INSERT INTO badges (id, name, description, icon, criteria, level_thresholds, active)
VALUES ('b6', '꾸준한 말씀', 'XP를 모으세요', '⚡', 'xp_earned', '{100,500,1000,3000,5000}', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b6_1', 'b6', 1, 100, 10, 10, 'XP 입문', 'XP 100 획득'),
  ('bl_b6_2', 'b6', 2, 500, 20, 20, 'XP 모험가', 'XP 500 획득'),
  ('bl_b6_3', 'b6', 3, 1000, 30, 30, 'XP 전사', 'XP 1000 획득'),
  ('bl_b6_4', 'b6', 4, 3000, 50, 50, 'XP 영웅', 'XP 3000 획득'),
  ('bl_b6_5', 'b6', 5, 5000, 100, 100, 'XP 마스터', 'XP 5000 획득')
ON CONFLICT (id) DO NOTHING;

-- 7. Remove invalid students (not in 2026 roster)
-- First, back up to audit log
INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, description, created_at)
SELECT
  'cleanup_' || s.id,
  'system',
  'admin',
  'student_deactivation',
  'student',
  s.id,
  'Deactivated student not in 2026 roster: ' || s.name,
  now()
FROM students s
WHERE s.role = 'student'
  AND s.is_teacher = false
  AND s.active = true
  AND s.id NOT IN (
    SELECT DISTINCT student_id FROM attendance_records ar
    JOIN attendance_sessions ats ON ar.session_id = ats.id
    WHERE ats.date >= '2026-01-01' AND ats.date <= '2026-12-31'
  )
  AND s.id NOT IN (
    SELECT id FROM teachers
  )
  AND s.id != 'admin_son'
  AND s.id NOT IN ('s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10',
    's11', 's12', 's13', 's14', 's15', 's16', 's17', 's18', 's19', 's20',
    's21', 's22', 's23', 's24', 's25', 's26', 's27', 's28', 's29', 's30',
    's31', 's32', 's33', 's34', 's35', 's36', 's37', 's38', 's39', 's40',
    's41', 's42', 's43', 's44', 's45', 's46', 's47', 's48', 's49', 's50',
    's51', 's52', 's53', 's54', 's55', 's56', 's57', 's58', 's59', 's60',
    's61', 's62', 's63', 's64', 's65', 's66', 's67', 's68', 's69', 's70',
    's71', 's72', 's73', 's74', 's75', 's76', 's77', 's78', 's79', 's80',
    's81', 's82', 's83', 's84', 's85', 's86', 's87', 's88', 's89', 's90',
    's91', 's92', 's93', 's94', 's95', 's96', 's97'
  );

-- Actually deactivate them
UPDATE students SET active = false
WHERE role = 'student'
  AND is_teacher = false
  AND active = true
  AND id NOT IN (
    SELECT DISTINCT student_id FROM attendance_records ar
    JOIN attendance_sessions ats ON ar.session_id = ats.id
    WHERE ats.date >= '2026-01-01' AND ats.date <= '2026-12-31'
  )
  AND id NOT IN (SELECT id FROM teachers)
  AND id != 'admin_son'
  AND id NOT IN ('s1','s2','s3','s4','s5','s6','s7','s8','s9','s10',
    's11','s12','s13','s14','s15','s16','s17','s18','s19','s20',
    's21','s22','s23','s24','s25','s26','s27','s28','s29','s30',
    's31','s32','s33','s34','s35','s36','s37','s38','s39','s40',
    's41','s42','s43','s44','s45','s46','s47','s48','s49','s50',
    's51','s52','s53','s54','s55','s56','s57','s58','s59','s60',
    's61','s62','s63','s64','s65','s66','s67','s68','s69','s70',
    's71','s72','s73','s74','s75','s76','s77','s78','s79','s80',
    's81','s82','s83','s84','s85','s86','s87','s88','s89','s90',
    's91','s92','s93','s94','s95','s96','s97');

-- 8. Attendance mileage backfill (idempotent)
-- Award 20 mileage for each qualifying 2026 attendance record
INSERT INTO attendance_rewards (id, attendance_record_id, student_id, amount, status, created_at)
SELECT
  'attrew_' || ar.id,
  ar.id,
  ar.student_id,
  20,
  'awarded',
  now()
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
WHERE ar.state IN ('present', 'late')
  AND s.role = 'student'
  AND s.is_teacher = false
  AND s.active = true
  AND s.id != 'admin_son'
  AND NOT EXISTS (
    SELECT 1 FROM attendance_rewards ar2
    WHERE ar2.attendance_record_id = ar.id AND ar2.student_id = ar.student_id
  );

-- Create mileage transactions for the backfill
INSERT INTO mileage_transactions (id, student_id, type, description, amount, date, created_at)
SELECT
  'atx_attrew_' || ar.id,
  ar.student_id,
  'attendance',
  '출석 마일리지 (2026 백필)',
  20,
  ats.date::date,
  now()
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
JOIN attendance_sessions ats ON ar.session_id = ats.id
JOIN attendance_rewards atr ON atr.attendance_record_id = ar.id AND atr.student_id = ar.student_id
WHERE ar.state IN ('present', 'late')
  AND s.role = 'student'
  AND s.is_teacher = false
  AND s.active = true
  AND s.id != 'admin_son'
  AND NOT EXISTS (
    SELECT 1 FROM mileage_transactions mt
    WHERE mt.student_id = ar.student_id AND mt.type = 'attendance' AND mt.description = '출석 마일리지 (2026 백필)'
      AND mt.date = ats.date::date
  );

-- Update student mileage balances from transactions
UPDATE students SET mileage = (
  SELECT COALESCE(SUM(mt.amount), 0)
  FROM mileage_transactions mt
  WHERE mt.student_id = students.id
)
WHERE students.role = 'student' AND students.is_teacher = false;

-- Update student XP balances (XP == mileage 합산 체계)
UPDATE students SET xp = (
  SELECT COALESCE(SUM(mt.amount), 0)
  FROM mileage_transactions mt
  WHERE mt.student_id = students.id
)
WHERE students.role = 'student' AND students.is_teacher = false;

-- Update class XP from student XP
UPDATE classes SET xp = (
  SELECT COALESCE(SUM(s.xp), 0)
  FROM students s
  WHERE s.class_id = classes.id AND s.active = true
);

-- Audit log for backfill
INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, description, created_at)
VALUES ('audit_backfill_2026', 'system', 'admin', 'attendance_backfill', 'system', 'all', '2026 attendance mileage backfill completed', now())
ON CONFLICT (id) DO NOTHING;
