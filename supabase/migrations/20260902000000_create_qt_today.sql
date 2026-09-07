-- Create qt_today table for daily QT content
CREATE TABLE IF NOT EXISTS qt_today (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT UNIQUE NOT NULL,
  passage TEXT DEFAULT '',
  verse TEXT DEFAULT '',
  content TEXT DEFAULT '',
  prayer TEXT DEFAULT '',
  song TEXT DEFAULT '',
  helper TEXT DEFAULT '',
  question1 TEXT DEFAULT '',
  question2 TEXT DEFAULT '',
  source TEXT DEFAULT 'duranno',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on date for fast lookups
CREATE INDEX IF NOT EXISTS idx_qt_today_date ON qt_today(date);

-- Insert today's QT as initial data
INSERT INTO qt_today (date, passage, verse, content, source)
VALUES (
  CURRENT_DATE::TEXT,
  '빌립보서 4:6-7',
  '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라.',
  '바울은 빌립보 교회에 염려를 내려놓고 기도하라고 권면합니다. 염려는 우리를 사로잡지만, 기도는 하나님이 함께하신다는 사실을 상기시켜줍니다. 오늘 하루, 염려가 밀려올 때 기도로 바꿔보세요.',
  'mock'
)
ON CONFLICT (date) DO NOTHING;

-- Also ensure other needed tables exist
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  weekly_xp INTEGER DEFAULT 0,
  attendance_attended INTEGER DEFAULT 0,
  attendance_total INTEGER DEFAULT 0,
  qt_count INTEGER DEFAULT 0,
  mission_count INTEGER DEFAULT 0,
  prayer_count INTEGER DEFAULT 0,
  class_message TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id TEXT PRIMARY KEY,
  event_name TEXT DEFAULT '주일예배',
  date TEXT NOT NULL,
  start_time TEXT DEFAULT '10:00',
  end_time TEXT DEFAULT '12:00',
  active BOOLEAN DEFAULT false,
  mileage_reward INTEGER DEFAULT 20,
  xp_reward INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES attendance_sessions(id),
  student_id TEXT REFERENCES students(id),
  state TEXT DEFAULT 'absent',
  check_time TIMESTAMPTZ DEFAULT now(),
  method TEXT DEFAULT 'manual',
  UNIQUE(session_id, student_id)
);

CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  criteria TEXT DEFAULT '',
  level_thresholds INTEGER[] DEFAULT '{10,30,50}',
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '',
  type TEXT DEFAULT 'weekly',
  target TEXT DEFAULT 'all',
  active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'general',
  message TEXT DEFAULT '',
  student_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shared_posts (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  student_name TEXT DEFAULT '',
  date TEXT NOT NULL,
  passage TEXT DEFAULT '',
  verse TEXT DEFAULT '',
  content TEXT DEFAULT '',
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS but allow all for now
ALTER TABLE qt_today ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on qt_today" ON qt_today FOR ALL USING (true);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on classes" ON classes FOR ALL USING (true);

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on attendance_sessions" ON attendance_sessions FOR ALL USING (true);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on attendance_records" ON attendance_records FOR ALL USING (true);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on badges" ON badges FOR ALL USING (true);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on missions" ON missions FOR ALL USING (true);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on activities" ON activities FOR ALL USING (true);

ALTER TABLE shared_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on shared_posts" ON shared_posts FOR ALL USING (true);
