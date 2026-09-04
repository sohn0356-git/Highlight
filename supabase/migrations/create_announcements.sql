CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  target TEXT DEFAULT 'all',
  important BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'published',
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON announcements FOR ALL USING (true) WITH CHECK (true);
