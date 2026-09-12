-- Cleanup: Drop empty legacy tables replaced by modern equivalents
-- rewards/redemptions  -> store_products/store_requests (admin store)
-- activities           -> community_activities (feed)
-- shared_posts         -> shared_qt_posts (QT share)
-- student_badges       -> student_badge_progress (badge progress)
-- All verified empty in production before writing this migration.

DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS redemptions;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS shared_posts;
DROP TABLE IF EXISTS student_badges;
