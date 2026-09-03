-- Seed all teachers from the 2026 roster
-- Idempotent: uses ON CONFLICT DO UPDATE

INSERT INTO teachers (id, name, birth_date, role, assigned_class_ids, active) VALUES
  ('t1', '이예은', '2004-01-03', 'teacher', '{"c_g1_2"}', true),
  ('t2', '주응선', '1984-01-16', 'teacher', '{"c_g1_1"}', true),
  ('t3', '이명호', '1987-01-24', 'teacher', '{}', true),
  ('t4', '김동욱', '1979-02-01', 'teacher', '{}', true),
  ('t5', '박경원', '1993-02-04', 'teacher', '{}', true),
  ('t6', '이수아', '2004-02-10', 'teacher', '{"c_g3_1","c_g3_2","c_g3_3","c_g3_4"}', true),
  ('t7', '박주형', '2000-02-25', 'teacher', '{"c_g2_1","c_g2_2","c_g2_3","c_g2_4","c_g2_5"}', true),
  ('t8', '손경주', '1994-02-28', 'admin', '{}', true),
  ('t9', '이주형', '2004-03-08', 'teacher', '{"c_g3_1","c_g3_2","c_g3_3","c_g3_4"}', true),
  ('t10', '윤여은', '2004-03-09', 'teacher', '{}', true),
  ('t11', '김영익', '1977-03-25', 'teacher', '{}', true),
  ('t12', '김한나', '1995-03-25', 'teacher', '{}', true),
  ('t13', '이수연', '2003-04-07', 'teacher', '{"c_g2_1","c_g2_2","c_g2_3","c_g2_4","c_g2_5"}', true),
  ('t14', '김진', '1967-04-20', 'teacher', '{}', true),
  ('t15', '송현이', '1999-04-22', 'teacher', '{"c_g3_1","c_g3_2","c_g3_3","c_g3_4"}', true),
  ('t16', '김성완', '1997-05-22', 'teacher', '{"c_g3_1","c_g3_2","c_g3_3","c_g3_4"}', true),
  ('t17', '서재완', '1981-05-22', 'teacher', '{"c_g1_3"}', true),
  ('t18', '김온유', '1994-06-18', 'teacher', '{}', true),
  ('t19', '강구원', '1981-07-18', 'teacher', '{}', true),
  ('t20', '김성학', '1992-08-11', 'teacher', '{"c_g2_1","c_g2_2","c_g2_3","c_g2_4","c_g2_5"}', true),
  ('t21', '김기광', '1991-08-25', 'teacher', '{"c_g3_1","c_g3_2","c_g3_3","c_g3_4"}', true),
  ('t22', '강영주', '1973-10-11', 'teacher', '{}', true),
  ('t23', '박소영', '1997-10-13', 'teacher', '{"c_g1_3"}', true),
  ('t24', '김채림', '1995-10-21', 'teacher', '{"c_g2_1","c_g2_2","c_g2_3","c_g2_4","c_g2_5"}', true),
  ('t25', '최영우', '2007-11-09', 'teacher', '{}', true),
  ('t26', '박성현', '1996-11-27', 'teacher', '{"c_g1_2"}', true),
  ('t27', '서지민', '1991-12-26', 'teacher', '{"c_g1_2"}', true),
  ('t28', '장결자', '1980-01-01', 'teacher', '{"c_g1_4"}', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  birth_date = EXCLUDED.birth_date,
  role = EXCLUDED.role,
  assigned_class_ids = EXCLUDED.assigned_class_ids,
  active = EXCLUDED.active;

-- Ensure Son Gyeongju has admin role
UPDATE teachers SET role = 'admin' WHERE id = 't8' AND name = '손경주';
UPDATE students SET role = 'admin', is_teacher = true WHERE id = 'admin_son' AND name = '손경주';
