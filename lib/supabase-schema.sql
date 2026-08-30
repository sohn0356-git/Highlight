-- Supabase Mileage App Schema
-- Supabase SQL 에디터에서 실행하세요 (https://supabase.com/dashboard → SQL Editor → New Query)

-- 1. classes 테이블
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  weekly_xp INT DEFAULT 0,
  attendance_attended INT DEFAULT 0,
  attendance_total INT DEFAULT 13,
  qt_count INT DEFAULT 0,
  mission_count INT DEFAULT 0,
  prayer_count INT DEFAULT 0,
  class_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. students 테이블
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  class_id TEXT REFERENCES classes(id),
  mileage INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. missions 테이블
CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INT DEFAULT 0,
  category TEXT DEFAULT 'weekly',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. completed_missions 테이블
CREATE TABLE IF NOT EXISTS completed_missions (
  id SERIAL PRIMARY KEY,
  mission_id TEXT REFERENCES missions(id),
  student_id TEXT REFERENCES students(id),
  reward INT DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mission_id, student_id)
);

-- 5. qt_records 테이블
CREATE TABLE IF NOT EXISTS qt_records (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id),
  date DATE NOT NULL,
  passage TEXT,
  verse TEXT,
  remembered TEXT,
  application TEXT,
  reward INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- 6. badges 테이블
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria INT DEFAULT 1,
  student_id TEXT REFERENCES students(id),
  progress INT DEFAULT 0,
  unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. prayer_requests 테이블
CREATE TABLE IF NOT EXISTS prayer_requests (
  id TEXT PRIMARY KEY,
  author_id TEXT REFERENCES students(id),
  anonymous BOOLEAN DEFAULT FALSE,
  content TEXT NOT NULL,
  prayer_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. prayer_participants 테이블 (기도 참여 기록)
CREATE TABLE IF NOT EXISTS prayer_participants (
  id SERIAL PRIMARY KEY,
  prayer_id TEXT REFERENCES prayer_requests(id),
  student_id TEXT REFERENCES students(id),
  prayed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prayer_id, student_id)
);

-- 9. mileage_transactions 테이블
CREATE TABLE IF NOT EXISTS mileage_transactions (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INT DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. community_activities 테이블
CREATE TABLE IF NOT EXISTS community_activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. qt_today 테이블 (오늘의 QT - 시스템 테이블)
CREATE TABLE IF NOT EXISTS qt_today (
  id TEXT PRIMARY KEY DEFAULT 'current',
  date DATE NOT NULL,
  passage TEXT NOT NULL,
  verse TEXT NOT NULL,
  content TEXT NOT NULL
);

-- 12. seasons 테이블
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  title TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- 13. shared_goal 테이블
CREATE TABLE IF NOT EXISTS shared_goal (
  id TEXT PRIMARY KEY DEFAULT 'current',
  label TEXT NOT NULL,
  current_xp INT DEFAULT 0,
  target_xp INT DEFAULT 60000,
  reward TEXT NOT NULL
);

-- RLS (Row Level Security) - 나중에 auth 연결 시 활성화
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qt_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_participants ENABLE ROW LEVEL SECURITY;

-- 현재는 인증 없이 개발 중이므로 모든 읽기/쓰기 허용 정책
CREATE POLICY "allow_all" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON qt_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON completed_missions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON mileage_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON prayer_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON prayer_participants FOR ALL USING (true) WITH CHECK (true);
