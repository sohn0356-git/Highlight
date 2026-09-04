-- prayer_comments 테이블 생성 (Supabase SQL Editor에서 실행)
CREATE TABLE IF NOT EXISTS prayer_comments (
  id TEXT PRIMARY KEY,
  prayer_id TEXT NOT NULL REFERENCES prayer_requests(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  student_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "prayer_comments_all" ON prayer_comments; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "prayer_comments_all" ON prayer_comments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_prayer_comments_prayer ON prayer_comments(prayer_id);
