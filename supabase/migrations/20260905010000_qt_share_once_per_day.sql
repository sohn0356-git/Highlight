-- ============================================================
-- QT 공유 하루 1회 제한: 중복 정리 + 유니크 제약
-- ============================================================

-- 1. 중복 공유글 정리 (학생+날짜 조합당 최신 1건만 유지)
DO $$
DECLARE
  dup RECORD;
  keep_id TEXT;
BEGIN
  FOR dup IN
    SELECT student_id, date, COUNT(*) AS cnt
    FROM shared_qt_posts
    GROUP BY student_id, date
    HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id
    FROM shared_qt_posts
    WHERE student_id = dup.student_id AND date = dup.date
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    -- 삭제 대상 공유글의 댓글 먼저 제거
    DELETE FROM qt_comments
    WHERE post_id IN (
      SELECT id FROM shared_qt_posts
      WHERE student_id = dup.student_id AND date = dup.date
        AND id <> keep_id
    );

    -- 중복 공유글 삭제 (최신 1건만 유지)
    DELETE FROM shared_qt_posts
    WHERE student_id = dup.student_id AND date = dup.date
      AND id <> keep_id;
  END LOOP;
END $$;

-- 2. 유니크 제약: 한 학생이 하루에 공유글 1개만
ALTER TABLE shared_qt_posts DROP CONSTRAINT IF EXISTS shared_qt_posts_student_date_key;
ALTER TABLE shared_qt_posts ADD CONSTRAINT shared_qt_posts_student_date_key UNIQUE (student_id, date);

-- 3. 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_shared_qt_posts_date ON shared_qt_posts(date);
CREATE INDEX IF NOT EXISTS idx_qt_comments_post ON qt_comments(post_id);
