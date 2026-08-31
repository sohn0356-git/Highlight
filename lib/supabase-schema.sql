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

-- 14. shared_qt_posts 테이블 (QT 공유 게시글)
CREATE TABLE IF NOT EXISTS shared_qt_posts (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id),
  passage TEXT,
  verse TEXT,
  remembered TEXT,
  application TEXT,
  reward INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- 15. qt_comments 테이블 (QT 공유 댓글)
CREATE TABLE IF NOT EXISTS qt_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES shared_qt_posts(id),
  student_id TEXT REFERENCES students(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shared_qt_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qt_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON shared_qt_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON qt_comments FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 아래는 app에서 Supabase로 관리할 테이블들을 추가하는 SQL입니다.
-- (위 기존 테이블들이 이미 만들어졌다면 아래만 추가로 실행하세요.)
-- ═══════════════════════════════════════════════════════════

-- 16. teachers 테이블 (선생님 이름/생년월일)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  class_id TEXT REFERENCES classes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. qt_today? 이미 있는지 — 없으면 생성
CREATE TABLE IF NOT EXISTS qt_today (
  id TEXT PRIMARY KEY DEFAULT 'current',
  date DATE NOT NULL,
  passage TEXT NOT NULL,
  verse TEXT NOT NULL,
  content TEXT NOT NULL
);

-- 18. seasons 테이블
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  title TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- 19. shared_goal 테이블
CREATE TABLE IF NOT EXISTS shared_goal (
  id TEXT PRIMARY KEY DEFAULT 'current',
  label TEXT NOT NULL,
  current_xp INT DEFAULT 0,
  target_xp INT DEFAULT 60000,
  reward TEXT NOT NULL
);

-- 20. community_activities 테이블
CREATE TABLE IF NOT EXISTS community_activities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. badges 테이블
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria INT DEFAULT 1,
  progress INT DEFAULT 0,
  unlocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON teachers FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE qt_today ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON qt_today FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON seasons FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE shared_goal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON shared_goal FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE community_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON community_activities FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON badges FOR ALL USING (true) WITH CHECK (true);

-- 시드 데이터 (없는 경우에만 삽입)
INSERT INTO classes (id, name, level, xp, weekly_xp, attendance_attended, attendance_total, qt_count, mission_count, prayer_count, class_message)
SELECT * FROM (VALUES
  ('c1','고2-3반',7,12450,620,11,13,37,21,18,'이번 주도 서로를 위해 기도해요 🙏'),
  ('c2','고1-2반',6,11920,540,9,13,28,15,10,'서로 돕고 성장하는 반!'),
  ('c3','고3-1반',5,10840,380,8,13,24,12,9,'주님 안에서 하나 되는 반!'),
  ('c4','고1-4반',4,10120,1420,10,13,30,17,11,'함께 배우고 함께 자라요!'),
  ('c5','고2-1반',4,9720,490,7,13,22,13,8,'믿음의 동역자들!'),
  ('c6','고3-2반',3,8950,310,9,13,26,15,10,'은혜와 감사의 반!')
) AS v(id,name,level,xp,weekly_xp,attendance_attended,attendance_total,qt_count,mission_count,prayer_count,class_message)
WHERE NOT EXISTS (SELECT 1 FROM classes);

INSERT INTO teachers (id, name, birth_date, class_id)
SELECT * FROM (VALUES
  ('t1','김선생','1985-03-12','c1'),
  ('t2','이선생','1988-07-25','c2'),
  ('t3','박선생','1990-01-05','c3'),
  ('t4','최선생','1987-11-19','c4')
) AS v(id,name,birth_date,class_id)
WHERE NOT EXISTS (SELECT 1 FROM teachers);

INSERT INTO qt_today (id, date, passage, verse, content)
SELECT * FROM (VALUES
  ('current', CURRENT_DATE, '빌립보서 4:6-7', '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라. 그리하면 모든 지각에 뛰어난 하나님의 평강이 그리스도 예수 안에서 너희 마음과 생각을 지키시리라.', '바울은 빌립보 교회에 염려를 내려놓고 기도하라고 권면합니다. 염려는 우리를 사로잡지만, 기도는 하나님이 함께하신다는 사실을 상기시켜줍니다. 오늘 하루, 염려가 밀려올 때 기도로 바꿔보세요.')
) AS v(id,date,passage,verse,content)
WHERE NOT EXISTS (SELECT 1 FROM qt_today);

INSERT INTO seasons (id, label, title, active)
SELECT * FROM (VALUES ('2026-fall','2026 FALL SEASON','함께 걸어가는 우리',TRUE))
AS v(id,label,title,active) WHERE NOT EXISTS (SELECT 1 FROM seasons);

INSERT INTO shared_goal (id, label, current_xp, target_xp, reward)
SELECT * FROM (VALUES ('current','고등부 공동 목표',48350,60000,'60,000 XP 달성하면 예배 후 전체 아이스크림 🍦'))
AS v(id,label,current_xp,target_xp,reward) WHERE NOT EXISTS (SELECT 1 FROM shared_goal);

INSERT INTO community_activities (id, type, message, created_at)
SELECT * FROM (VALUES
  ('a1','level','🎉 고2-3반이 LV.8에 도달했어요!',NOW() - INTERVAL '3 days'),
  ('a2','prayer','🙏 이번 주 고등부에서 128번의 기도가 있었어요.',NOW() - INTERVAL '2 days'),
  ('a3','qt','📖 이번 주 QT 200회를 달성했어요!',NOW() - INTERVAL '1 day'),
  ('a4','xp','🔥 고1-4반이 이번 주 1,000XP를 돌파했어요!',NOW()),
  ('a5','milestone','🎊 고등부 마일리지 총합 50,000M을 넘었어요!',NOW() - INTERVAL '2 days')
) AS v(id,type,message,created_at) WHERE NOT EXISTS (SELECT 1 FROM community_activities);

INSERT INTO badges (id, icon, name, description, criteria, progress, unlocked)
SELECT * FROM (VALUES
  ('b1','🌱','첫 걸음','첫 QT 완료',1,1,TRUE),
  ('b2','📖','말씀 탐험가','QT 10회',10,0,FALSE),
  ('b3','⛪','예배자','예배 10회 참석',10,0,FALSE),
  ('b4','🙏','중보자','친구를 위해 30회 기도',30,0,FALSE)
) AS v(id,icon,name,description,criteria,progress,unlocked) WHERE NOT EXISTS (SELECT 1 FROM badges);
