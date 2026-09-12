-- 레거시 테이블 및 미사용 컬럼 최종 정리 (원격 DB 적용 완료, 로컬 신규 DB 동기화용)
-- 삭제 테이블은 모두 0행 + 앱 코드에서 미사용으로 확인됨

ALTER TABLE students DROP COLUMN IF EXISTS weekly_xp;

DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS shared_posts;
DROP TABLE IF EXISTS student_badges;
DROP TABLE IF EXISTS rewards;
DROP TABLE IF EXISTS redemptions;
DROP TABLE IF EXISTS seasons;
DROP TABLE IF EXISTS shared_goal;
