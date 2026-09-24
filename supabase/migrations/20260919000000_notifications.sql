-- In-app notifications (e.g. someone prayed for my prayer request)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'prayer',
  title TEXT DEFAULT '',
  body TEXT DEFAULT '',
  related_id TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN DROP POLICY IF EXISTS "notifications_all" ON notifications; EXCEPTION WHEN OTHERS THEN NULL; END $$;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true) WITH CHECK (true);
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
