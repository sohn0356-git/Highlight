-- 관리자 DB 탭의 "전체 삭제" 기능용 RPC
-- p_cascade=false: DELETE FROM (FK 자식 데이터가 있으면 실패)
-- p_cascade=true : TRUNCATE ... CASCADE (관련 하위 테이블까지 모두 삭제)
-- SECURITY DEFINER + 식별자 검증 + 테이블 allowlist로 임의 SQL 실행 차단

CREATE OR REPLACE FUNCTION admin_delete_all(p_table text, p_cascade boolean DEFAULT false)
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
  IF p_table IS NULL OR trim(p_table) = '' THEN
    RAISE EXCEPTION 'table is required';
  END IF;
  IF NOT (p_table ~ '^[a-z_][a-z0-9_]*$') THEN
    RAISE EXCEPTION 'invalid identifier';
  END IF;
  IF NOT (p_table = ANY (allowed_tables)) THEN
    RAISE EXCEPTION 'table not allowed';
  END IF;

  IF p_cascade THEN
    EXECUTE format('TRUNCATE TABLE %I CASCADE', p_table);
  ELSE
    EXECUTE format('DELETE FROM %I WHERE true', p_table); -- WHERE true: PostgREST 안전장치 통과용
  END IF;
  RETURN format('table %I cleared', p_table);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_all(text, boolean) TO anon, authenticated, service_role;
