-- Enable Supabase Realtime for missions and announcements
-- This allows the student app to receive live updates when admin adds/edits content

-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE missions;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE prayer_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE shared_qt_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_quests;
ALTER PUBLICATION supabase_realtime ADD TABLE qt_today;
