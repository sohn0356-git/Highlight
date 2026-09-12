-- 실제로 앱 코드에서 전혀 사용되지 않는 컬럼 제거
-- 사전 검증: 코드·쿼리·UI 어디서도 참조되지 않음 (런타임 검색 완료)
ALTER TABLE badges DROP COLUMN IF EXISTS criteria;

-- classes: 통계는 stats-service가 원장(attendances/qt/missions/prayers)에서 직접 집계하므로
-- 이 비정규화 집계 컬럼은 어떤 화면에서도 사용되지 않음
ALTER TABLE classes DROP COLUMN IF EXISTS attendance_attended;
ALTER TABLE classes DROP COLUMN IF EXISTS attendance_total;
ALTER TABLE classes DROP COLUMN IF EXISTS mission_count;
ALTER TABLE classes DROP COLUMN IF EXISTS prayer_count;
ALTER TABLE classes DROP COLUMN IF EXISTS class_message;

-- daily_quests: 완료 시각 컬럼 (completion_date와 동일 의미, 코드에서 읽지 않음)
ALTER TABLE daily_quests DROP COLUMN IF EXISTS completed_at;
