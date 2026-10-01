-- Comments on special missions shown on the home tab.
CREATE TABLE IF NOT EXISTS mission_comments (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mission_comments
  ADD COLUMN IF NOT EXISTS private BOOLEAN DEFAULT FALSE;

ALTER TABLE mission_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "mission_comments_all" ON mission_comments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "mission_comments_all" ON mission_comments
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mission_comments_mission ON mission_comments(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_comments_student ON mission_comments(student_id);
