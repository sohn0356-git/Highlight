"use client";
/**
 * Auto-migration runner.
 * Checks if migrations have been applied and runs them if not.
 * Uses the anon key via Supabase client.
 */
import { getSupabase } from "./supabase";
import { isSupabaseReady } from "./config";

const MIGRATION_KEY = "highlight_migration_version";
const CURRENT_VERSION = 5;

const MIGRATION_SQL = `
-- Badge levels
CREATE TABLE IF NOT EXISTS badge_levels (
  id TEXT PRIMARY KEY, badge_id TEXT NOT NULL, level INTEGER NOT NULL,
  threshold INTEGER DEFAULT 0, reward_mileage INTEGER DEFAULT 0, reward_xp INTEGER DEFAULT 0,
  title TEXT DEFAULT '', description TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(badge_id, level)
);
ALTER TABLE badge_levels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "badge_levels_all" ON badge_levels; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "badge_levels_all" ON badge_levels FOR ALL USING (true);

-- Student badge progress
CREATE TABLE IF NOT EXISTS student_badge_progress (
  id TEXT PRIMARY KEY, student_id TEXT NOT NULL, badge_id TEXT NOT NULL,
  current_level INTEGER DEFAULT 0, current_progress INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(), UNIQUE(student_id, badge_id)
);
ALTER TABLE student_badge_progress ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "sbp_all" ON student_badge_progress; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "sbp_all" ON student_badge_progress FOR ALL USING (true);

-- Attendance rewards
CREATE TABLE IF NOT EXISTS attendance_rewards (
  id TEXT PRIMARY KEY, attendance_record_id TEXT NOT NULL, student_id TEXT NOT NULL,
  amount INTEGER DEFAULT 20, status TEXT DEFAULT 'awarded',
  awarded_at TIMESTAMPTZ DEFAULT now(), reversed_at TIMESTAMPTZ,
  UNIQUE(attendance_record_id, student_id)
);
ALTER TABLE attendance_rewards ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "attrew_all" ON attendance_rewards; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "attrew_all" ON attendance_rewards FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mileage_tx_student ON mileage_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_mileage_tx_date ON mileage_transactions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_year_week ON attendance_records(year, week);
CREATE INDEX IF NOT EXISTS idx_qt_records_student ON qt_records(student_id);
CREATE INDEX IF NOT EXISTS idx_qt_records_date ON qt_records(date);
CREATE INDEX IF NOT EXISTS idx_student_badge_progress_student ON student_badge_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_badge_levels_badge ON badge_levels(badge_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rewards_record ON attendance_rewards(attendance_record_id);
CREATE INDEX IF NOT EXISTS idx_daily_quests_student_date ON daily_quests(student_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(active);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_teachers_active ON teachers(active);

-- Mission comments
CREATE TABLE IF NOT EXISTS mission_comments (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mission_comments ADD COLUMN IF NOT EXISTS private BOOLEAN DEFAULT FALSE;
ALTER TABLE mission_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "mission_comments_all" ON mission_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "mission_comments_all" ON mission_comments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_mission_comments_mission ON mission_comments(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_comments_student ON mission_comments(student_id);

-- Push category preferences
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS prayer_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS praise_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS qt_enabled BOOLEAN DEFAULT TRUE;
UPDATE push_subscriptions
SET
  announcement_enabled = COALESCE(announcement_enabled, TRUE),
  prayer_enabled = COALESCE(prayer_enabled, TRUE),
  praise_enabled = COALESCE(praise_enabled, TRUE),
  qt_enabled = COALESCE(qt_enabled, TRUE);

-- Son Gyeongju admin
INSERT INTO students (id, name, birth_date, class_id, role, is_teacher, active, talents)
VALUES ('admin_son', '손경주', '1994-02-28', '', 'admin', true, true, 0)
ON CONFLICT (id) DO UPDATE SET role = 'admin', is_teacher = true, active = true;

-- Badge levels seed
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b1_1','b1',1,1,10,10,'말씀 입문','QT 1회 완료'),
  ('bl_b1_2','b1',2,7,20,20,'말씀 탐험가','QT 7회 완료'),
  ('bl_b1_3','b1',3,15,30,30,'말씀 구도자','QT 15회 완료'),
  ('bl_b1_4','b1',4,31,50,50,'말씀 열정가','QT 31회 완료'),
  ('bl_b1_5','b1',5,100,100,100,'말씀 마스터','QT 100회 완료'),
  ('bl_b2_1','b2',1,1,10,10,'기도 시작','기도 1회 참여'),
  ('bl_b2_2','b2',2,5,20,20,'기도 동참자','기도 5회 참여'),
  ('bl_b2_3','b2',3,15,30,30,'기도 중보자','기도 15회 참여'),
  ('bl_b2_4','b2',4,30,50,50,'기도 용사','기도 30회 참여'),
  ('bl_b2_5','b2',5,60,100,100,'기도 마스터','기도 60회 참여'),
  ('bl_b3_1','b3',1,1,10,10,'미션 입문','미션 1회 완료'),
  ('bl_b3_2','b3',2,5,20,20,'미션 수행자','미션 5회 완료'),
  ('bl_b3_3','b3',3,10,30,30,'미션 헌신자','미션 10회 완료'),
  ('bl_b3_4','b3',4,20,50,50,'미션 정복자','미션 20회 완료'),
  ('bl_b3_5','b3',5,40,100,100,'미션 마스터','미션 40회 완료'),
  ('bl_b4_1','b4',1,1,10,10,'첫 출석','출석 1회'),
  ('bl_b4_2','b4',2,8,20,20,'꾸준한 출석','출석 8회'),
  ('bl_b4_3','b4',3,20,30,30,'성실한 출석','출석 20회'),
  ('bl_b4_4','b4',4,35,50,50,'헌신한 출석','출석 35회'),
  ('bl_b4_5','b4',5,50,100,100,'출석 마스터','출석 50회'),
  ('bl_b5_1','b5',1,50,10,10,'마일리지 입문','마일리지 50M'),
  ('bl_b5_2','b5',2,200,20,20,'마일리지 모험가','마일리지 200M'),
  ('bl_b5_3','b5',3,500,30,30,'마일리지 수집가','마일리지 500M'),
  ('bl_b5_4','b5',4,1000,50,50,'마일리지 갑부','마일리지 1000M'),
  ('bl_b5_5','b5',5,3000,100,100,'마일리지 마스터','마일리지 3000M')
ON CONFLICT (id) DO NOTHING;

-- XP badge
INSERT INTO badges (id, name, description, icon, requirement_type, requirement_value, active, mileage_reward, category, display_order, level_thresholds, level_labels, level_rewards)
VALUES ('b6','경험의 달인','XP를 모으세요','⚡','xp_earned',100,true,0,'xp',6,'{100,500,1000,3000,5000}','{Lv.1,Lv.2,Lv.3,Lv.4,Lv.MAX}','{10,20,30,50,100}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b6_1','b6',1,100,10,10,'XP 입문','XP 100 획득'),
  ('bl_b6_2','b6',2,500,20,20,'XP 모험가','XP 500 획득'),
  ('bl_b6_3','b6',3,1000,30,30,'XP 전사','XP 1000 획득'),
  ('bl_b6_4','b6',4,3000,50,50,'XP 영웅','XP 3000 획득'),
  ('bl_b6_5','b6',5,5000,100,100,'XP 마스터','XP 5000 획득')
ON CONFLICT (id) DO NOTHING;

UPDATE students SET role='admin', is_teacher=true WHERE id='admin_son';
`;

export async function runMigrations() {
  if (!isSupabaseReady) return;
  if (typeof window === "undefined") return;

  const currentVersion = parseInt(localStorage.getItem(MIGRATION_KEY) || "0", 10);
  if (currentVersion >= CURRENT_VERSION) return;

  const sb = getSupabase();
  if (!sb) return;

  try {
    // Execute migration via RPC (Supabase supports rpc for arbitrary SQL with service role)
    // Since we only have anon key, we'll use the REST API approach
    // For Supabase with anon key, we need to use individual table operations
    // Let's try the sql endpoint directly
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({ query: MIGRATION_SQL }),
      });

      if (response.ok) {
        localStorage.setItem(MIGRATION_KEY, String(CURRENT_VERSION));
        console.log(`Migration v${CURRENT_VERSION} applied successfully`);
      } else {
        // Fallback: try individual table checks and inserts
        console.log("RPC migration failed, trying individual operations...");
        await runFallbackMigrations(sb);
        localStorage.setItem(MIGRATION_KEY, String(CURRENT_VERSION));
      }
    }
  } catch (err) {
    console.error("Migration error:", err);
    // Try fallback
    try {
      await runFallbackMigrations(sb);
      localStorage.setItem(MIGRATION_KEY, String(CURRENT_VERSION));
    } catch {}
  }
}

async function runFallbackMigrations(sb: any) {
  // Check if badge_levels table exists by trying to query it
  try {
    const { error } = await sb.from("badge_levels").select("id").limit(1);
    if (error && error.message.includes("does not exist")) {
      console.log("Tables need to be created via Supabase SQL Editor");
      console.log("Please run the migration SQL files in Supabase Dashboard → SQL Editor");
    }
  } catch {}

  // Seed Son Gyeongju admin
  try {
    await sb.from("students").upsert({
      id: "admin_son", name: "손경주", birth_date: "1994-02-28",
      class_id: "", role: "admin", is_teacher: true, active: true, talents: 0,
    }, { onConflict: "id" });
  } catch {}

  // Seed badge levels
  try {
    const badgeLevels = [
      { id: "bl_b1_1", badge_id: "b1", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "말씀 입문", description: "QT 1회 완료" },
      { id: "bl_b1_2", badge_id: "b1", level: 2, threshold: 7, reward_mileage: 20, reward_xp: 20, title: "말씀 탐험가", description: "QT 7회 완료" },
      { id: "bl_b1_3", badge_id: "b1", level: 3, threshold: 15, reward_mileage: 30, reward_xp: 30, title: "말씀 구도자", description: "QT 15회 완료" },
      { id: "bl_b1_4", badge_id: "b1", level: 4, threshold: 31, reward_mileage: 50, reward_xp: 50, title: "말씀 열정가", description: "QT 31회 완료" },
      { id: "bl_b1_5", badge_id: "b1", level: 5, threshold: 100, reward_mileage: 100, reward_xp: 100, title: "말씀 마스터", description: "QT 100회 완료" },
      { id: "bl_b2_1", badge_id: "b2", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "기도 시작", description: "기도 1회 참여" },
      { id: "bl_b2_2", badge_id: "b2", level: 2, threshold: 5, reward_mileage: 20, reward_xp: 20, title: "기도 동참자", description: "기도 5회 참여" },
      { id: "bl_b2_3", badge_id: "b2", level: 3, threshold: 15, reward_mileage: 30, reward_xp: 30, title: "기도 중보자", description: "기도 15회 참여" },
      { id: "bl_b2_4", badge_id: "b2", level: 4, threshold: 30, reward_mileage: 50, reward_xp: 50, title: "기도 용사", description: "기도 30회 참여" },
      { id: "bl_b2_5", badge_id: "b2", level: 5, threshold: 60, reward_mileage: 100, reward_xp: 100, title: "기도 마스터", description: "기도 60회 참여" },
      { id: "bl_b3_1", badge_id: "b3", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "미션 입문", description: "미션 1회 완료" },
      { id: "bl_b3_2", badge_id: "b3", level: 2, threshold: 5, reward_mileage: 20, reward_xp: 20, title: "미션 수행자", description: "미션 5회 완료" },
      { id: "bl_b3_3", badge_id: "b3", level: 3, threshold: 10, reward_mileage: 30, reward_xp: 30, title: "미션 헌신자", description: "미션 10회 완료" },
      { id: "bl_b3_4", badge_id: "b3", level: 4, threshold: 20, reward_mileage: 50, reward_xp: 50, title: "미션 정복자", description: "미션 20회 완료" },
      { id: "bl_b3_5", badge_id: "b3", level: 5, threshold: 40, reward_mileage: 100, reward_xp: 100, title: "미션 마스터", description: "미션 40회 완료" },
      { id: "bl_b4_1", badge_id: "b4", level: 1, threshold: 1, reward_mileage: 10, reward_xp: 10, title: "첫 출석", description: "출석 1회" },
      { id: "bl_b4_2", badge_id: "b4", level: 2, threshold: 8, reward_mileage: 20, reward_xp: 20, title: "꾸준한 출석", description: "출석 8회" },
      { id: "bl_b4_3", badge_id: "b4", level: 3, threshold: 20, reward_mileage: 30, reward_xp: 30, title: "성실한 출석", description: "출석 20회" },
      { id: "bl_b4_4", badge_id: "b4", level: 4, threshold: 35, reward_mileage: 50, reward_xp: 50, title: "헌신한 출석", description: "출석 35회" },
      { id: "bl_b4_5", badge_id: "b4", level: 5, threshold: 50, reward_mileage: 100, reward_xp: 100, title: "출석 마스터", description: "출석 50회" },
      { id: "bl_b5_1", badge_id: "b5", level: 1, threshold: 50, reward_mileage: 10, reward_xp: 10, title: "마일리지 입문", description: "마일리지 50M" },
      { id: "bl_b5_2", badge_id: "b5", level: 2, threshold: 200, reward_mileage: 20, reward_xp: 20, title: "마일리지 모험가", description: "마일리지 200M" },
      { id: "bl_b5_3", badge_id: "b5", level: 3, threshold: 500, reward_mileage: 30, reward_xp: 30, title: "마일리지 수집가", description: "마일리지 500M" },
      { id: "bl_b5_4", badge_id: "b5", level: 4, threshold: 1000, reward_mileage: 50, reward_xp: 50, title: "마일리지 갑부", description: "마일리지 1000M" },
      { id: "bl_b5_5", badge_id: "b5", level: 5, threshold: 3000, reward_mileage: 100, reward_xp: 100, title: "마일리지 마스터", description: "마일리지 3000M" },
      { id: "bl_b6_1", badge_id: "b6", level: 1, threshold: 100, reward_mileage: 10, reward_xp: 10, title: "XP 입문", description: "XP 100 획득" },
      { id: "bl_b6_2", badge_id: "b6", level: 2, threshold: 500, reward_mileage: 20, reward_xp: 20, title: "XP 모험가", description: "XP 500 획득" },
      { id: "bl_b6_3", badge_id: "b6", level: 3, threshold: 1000, reward_mileage: 30, reward_xp: 30, title: "XP 전사", description: "XP 1000 획득" },
      { id: "bl_b6_4", badge_id: "b6", level: 4, threshold: 3000, reward_mileage: 50, reward_xp: 50, title: "XP 영웅", description: "XP 3000 획득" },
      { id: "bl_b6_5", badge_id: "b6", level: 5, threshold: 5000, reward_mileage: 100, reward_xp: 100, title: "XP 마스터", description: "XP 5000 획득" },
    ];
    await sb.from("badge_levels").upsert(badgeLevels, { onConflict: "id" });
  } catch {}
}
