-- Create prayer_comments table
CREATE TABLE IF NOT EXISTS prayer_comments (
  id TEXT PRIMARY KEY,
  prayer_id TEXT NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  student_name TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE prayer_comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (authenticated users)
CREATE POLICY "Allow all for authenticated" ON prayer_comments
  FOR ALL USING (true) WITH CHECK (true);
