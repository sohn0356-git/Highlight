-- 관리자 "모든 달란트 0으로 리셋" 기능용 RPC
-- 1) 잔액이 있던 학생: mileage_transactions 원장에 정산(-잔액) 기록 (이력 보존)
-- 2) students.talents = 0
-- 3) classes.xp / weekly_xp = 0 (반 총합 동기화)
-- 4) audit_logs에 감사 기록

CREATE OR REPLACE FUNCTION admin_reset_all_talents()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  -- 원장 정산 기록 (잔액이 0이 아닌 학생만)
  INSERT INTO mileage_transactions (id, student_id, type, description, amount, date, created_at)
  SELECT 'rst_' || id || '_' || floor(extract(epoch from now()) * 1000)::text,
         id, '전체 리셋', '관리자 달란트 전체 리셋', -COALESCE(talents, 0),
         (now() AT TIME ZONE 'Asia/Seoul')::date, now()
  FROM students
  WHERE COALESCE(talents, 0) <> 0;

  -- 학생 달란트 0으로
  UPDATE students SET talents = 0 WHERE true;
  GET DIAGNOSTICS n = ROW_COUNT;

  -- 반(클래스) 총합 동기화
  UPDATE classes SET xp = 0, weekly_xp = 0 WHERE true;

  -- 감사 기록
  INSERT INTO audit_logs (id, actor_id, actor_role, action, target_type, target_id, description, created_at)
  VALUES ('al_reset_' || floor(extract(epoch from now()) * 1000)::text,
          'admin', 'admin', 'talents_reset_all', 'students', 'all',
          '모든 학생 달란트 0으로 리셋', now());

  RETURN n || ' students reset';
END;
$$;

GRANT EXECUTE ON FUNCTION admin_reset_all_talents() TO anon, authenticated, service_role;
