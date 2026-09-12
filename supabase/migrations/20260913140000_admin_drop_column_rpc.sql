-- 관리자 DB 탭에서 컬럼 삭제를 안전하게 수행하기 위한 RPC
-- SECURITY DEFINER + 식별자 검증 + 허용 테이블 allowlist로 임의 SQL 실행을 차단
-- (DROP COLUMN IF EXISTS만 허용하며, 테이블/컬럼명은 [a-z_][a-z0-9_]* 패턴만 허용)

CREATE OR REPLACE FUNCTION admin_drop_column(p_table text, p_column text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_tables text[] := ARRAY[
    'students','teachers','classes',
    'attendance_sessions','attendance_records','attendance_rewards',
    'qt_today','qt_records','qt_comments','shared_qt_posts',
    'prayer_requests','prayer_participants','prayer_comments',
    'praises','missions','completed_missions','daily_quests',
    'community_activities','announcements','store_products','store_requests',
    'badges','badge_levels','student_badge_progress',
    'mileage_transactions','audit_logs','settings'
  ];
BEGIN
  IF p_table IS NULL OR p_column IS NULL OR trim(p_table) = '' OR trim(p_column) = '' THEN
    RAISE EXCEPTION 'table and column are required';
  END IF;
  IF NOT (p_table ~ '^[a-z_][a-z0-9_]*$' AND p_column ~ '^[a-z_][a-z0-9_]*$') THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;
  IF NOT (p_table = ANY (allowed_tables)) THEN
    RAISE EXCEPTION 'table not allowed';
  END IF;

  EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS %I', p_table, p_column);
  RETURN format('column %I.%I dropped', p_table, p_column);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_drop_column(text, text) TO anon, authenticated, service_role;
