-- mileage_transactions: 일부 배포 환경에 누락된 비정규화 컬럼 동기화
-- 원격 DB에는 이 컬럼들이 없어 INSERT가 계속 실패했음 (PGRST204).
-- 코드는 이 컬럼 없이도 동작하며, 이 컬럼은 선택적 감사 정보용.
ALTER TABLE mileage_transactions ADD COLUMN IF NOT EXISTS student_name TEXT DEFAULT '';
ALTER TABLE mileage_transactions ADD COLUMN IF NOT EXISTS class_name TEXT DEFAULT '';
ALTER TABLE mileage_transactions ADD COLUMN IF NOT EXISTS actor_name TEXT DEFAULT '';
