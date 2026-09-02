-- announcements 테이블 생성
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

-- RLS 설정
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on announcements" ON announcements FOR ALL USING (true);

-- 기존 시드 데이터 삽입
INSERT INTO announcements (id, title, content, target, important, status, start_date, end_date, created_at)
VALUES
  ('an1', '9월 수련회 안내', '9월 13-14일 수련회가 있습니다. 참가비 30,000원을 9월 7일까지 납부해주세요.', 'all', true, 'published', '2026-08-25', '2026-09-14', '2026-08-25T10:00:00Z')
ON CONFLICT (id) DO NOTHING;
