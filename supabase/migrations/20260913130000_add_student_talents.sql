-- 학생 잔액 컬럼 통합: mileage + xp → talents (단일 달란트 잔액)
-- 기존 코드는 mileage와 xp를 항상 동일한 값으로 기록해왔으므로
-- 중복 합산을 피하기 위해 둘 중 더 큰 값으로 백필한다.

ALTER TABLE students ADD COLUMN IF NOT EXISTS talents INT DEFAULT 0;

UPDATE students
SET talents = GREATEST(COALESCE(mileage, 0), COALESCE(xp, 0))
WHERE talents IS NULL OR talents = 0;

-- 레거시 컬럼 제거 (백필 완료 후)
ALTER TABLE students DROP COLUMN IF EXISTS mileage;
ALTER TABLE students DROP COLUMN IF EXISTS xp;

-- 정렬/랭킹 성능 인덱스
CREATE INDEX IF NOT EXISTS idx_students_talents ON students(talents DESC);
