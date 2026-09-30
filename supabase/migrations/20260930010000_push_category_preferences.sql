-- Per-category web push preferences.
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS prayer_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS praise_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS qt_enabled BOOLEAN DEFAULT TRUE;

UPDATE push_subscriptions
SET
  announcement_enabled = COALESCE(announcement_enabled, TRUE),
  prayer_enabled = COALESCE(prayer_enabled, TRUE),
  praise_enabled = COALESCE(praise_enabled, TRUE),
  qt_enabled = COALESCE(qt_enabled, TRUE);
