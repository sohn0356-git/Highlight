-- ============================================================
-- 1) 기도 1일 1회 (기도제목별 하루 1회, 다음날 다시 가능)
-- ============================================================
ALTER TABLE prayer_participants ADD COLUMN IF NOT EXISTS pray_date TEXT DEFAULT '';
UPDATE prayer_participants
SET pray_date = TO_CHAR((prayed_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD')
WHERE pray_date IS NULL OR pray_date = '';
ALTER TABLE prayer_participants DROP CONSTRAINT IF EXISTS prayer_participants_prayer_id_student_id_key;
ALTER TABLE prayer_participants ADD CONSTRAINT uq_prayer_day UNIQUE (prayer_id, student_id, pray_date);

-- ============================================================
-- 2) 칭찬 1일 1회 (praiser + date 중복 방지)
-- ============================================================
ALTER TABLE praises ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
UPDATE praises
SET date = TO_CHAR((created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD')
WHERE date IS NULL OR date = '';

-- 기존 중복(같은 날 같은 사람이 여러번) 정리: 최신 1건만 유지
DO $$
DECLARE
  dup RECORD;
  keep_id TEXT;
BEGIN
  FOR dup IN
    SELECT praiser_id, date, COUNT(*) AS cnt
    FROM praises
    GROUP BY praiser_id, date
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM praises
    WHERE praiser_id = dup.praiser_id AND date = dup.date
    ORDER BY created_at DESC, id DESC
    LIMIT 1;
    DELETE FROM praises
    WHERE praiser_id = dup.praiser_id AND date = dup.date
      AND id <> keep_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_praises_praiser_date ON praises (praiser_id, date);

-- ============================================================
-- 3) 교사 student 계정 생성 (칭찬 FK + 선생님 활동 참여 지원)
-- ============================================================
INSERT INTO students (id, name, birth_date, class_id, mileage, role, is_teacher, active, grade, enrollment_status)
SELECT t.id, t.name, COALESCE(t.birth_date, '1990-01-01')::date, COALESCE(t.assigned_class_ids[1], ''), 0, t.role, true, true, 1, 'active'
FROM teachers t
LEFT JOIN students s ON s.id = t.id
WHERE s.id IS NULL
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, is_teacher = true;
