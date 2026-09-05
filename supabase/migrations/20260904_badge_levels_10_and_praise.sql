-- ============================================================
-- Badge Levels 6~10 추가 + 칭찬 배지(b7) 신규 등록
-- ============================================================

-- b1: 말씀 탐험가 (QT 완료)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b1_6', 'b1', 6, 200, 120, 120, '말씀 읽기달인', 'QT 200회 완료'),
  ('bl_b1_7', 'b1', 7, 350, 150, 150, '말씀 성찰자', 'QT 350회 완료'),
  ('bl_b1_8', 'b1', 8, 500, 200, 200, '말씀 씨앗', 'QT 500회 완료'),
  ('bl_b1_9', 'b1', 9, 750, 250, 250, '말씀 뿌리', 'QT 750회 완료'),
  ('bl_b1_10','b1', 10, 1000, 300, 300, '말씀 완전체', 'QT 1000회 완료')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- b2: 예배자 (기도 참여)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b2_6', 'b2', 6, 100, 120, 120, '기도 전사', '기도 100회 참여'),
  ('bl_b2_7', 'b2', 7, 150, 150, 150, '기도 기둥', '기도 150회 참여'),
  ('bl_b2_8', 'b2', 8, 200, 200, 200, '기도 봉화', '기도 200회 참여'),
  ('bl_b2_9', 'b2', 9, 300, 250, 250, '기도 요새', '기도 300회 참여'),
  ('bl_b2_10','b2', 10, 500, 300, 300, '기도 왕', '기도 500회 참여')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- b3: 중보 기도자 (미션 완료)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b3_6', 'b3', 6, 60, 120, 120, '미션 해결사', '미션 60회 완료'),
  ('bl_b3_7', 'b3', 7, 80, 150, 150, '미션 영웅', '미션 80회 완료'),
  ('bl_b3_8', 'b3', 8, 100, 200, 200, '미션 전설', '미션 100회 완료'),
  ('bl_b3_9', 'b3', 9, 150, 250, 250, '미션 레전드', '미션 150회 완료'),
  ('bl_b3_10','b3', 10, 200, 300, 300, '미션 최강자', '미션 200회 완료')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- b4: 미션 정복자 (출석)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b4_6', 'b4', 6, 70, 120, 120, '출석 달인', '출석 70회'),
  ('bl_b4_7', 'b4', 7, 90, 150, 150, '출석 챔피언', '출석 90회'),
  ('bl_b4_8', 'b4', 8, 110, 200, 200, '출석 전설', '출석 110회'),
  ('bl_b4_9', 'b4', 9, 130, 250, 250, '출석 레전드', '출석 130회'),
  ('bl_b4_10','b4', 10, 150, 300, 300, '출석 불변', '출석 150회')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- b5: 마일리지 수집가
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b5_6', 'b5', 6, 5000, 120, 120, '마일리지 보석', '마일리지 5000M'),
  ('bl_b5_7', 'b5', 7, 8000, 150, 150, '마일리지 왕관', '마일리지 8000M'),
  ('bl_b5_8', 'b5', 8, 12000, 200, 200, '마일리지 황금', '마일리지 12000M'),
  ('bl_b5_9', 'b5', 9, 18000, 250, 250, '마일리지 보물', '마일리지 18000M'),
  ('bl_b5_10','b5', 10, 25000, 300, 300, '마일리지 황제', '마일리지 25000M')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- b6: 꾸준한 말씀 (XP)
INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b6_6', 'b6', 6, 8000, 120, 120, 'XP 전설', 'XP 8000 획득'),
  ('bl_b6_7', 'b6', 7, 12000, 150, 150, 'XP 영웅', 'XP 12000 획득'),
  ('bl_b6_8', 'b6', 8, 18000, 200, 200, 'XP 왕', 'XP 18000 획득'),
  ('bl_b6_9', 'b6', 9, 25000, 250, 250, 'XP 레전드', 'XP 25000 획득'),
  ('bl_b6_10','b6', 10, 35000, 300, 300, 'XP 불가능', 'XP 35000 획득')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;

-- b7: 칭찬 배지 (신규)
INSERT INTO badges (id, name, description, icon, criteria, level_thresholds, active) VALUES
  ('b7', '칭찬天使', '칭찬 많이 받는 사람', '😇', 'praise_count', '{1,3,5,10,15,20,30,40,50,75}', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  criteria = EXCLUDED.criteria,
  level_thresholds = EXCLUDED.level_thresholds,
  active = EXCLUDED.active;

INSERT INTO badge_levels (id, badge_id, level, threshold, reward_mileage, reward_xp, title, description) VALUES
  ('bl_b7_1',  'b7', 1,  1,  10, 10, '칭찬 시작',    '칭찬 1회 받음'),
  ('bl_b7_2',  'b7', 2,  3,  20, 20, '칭찬 받는 사람', '칭찬 3회 받음'),
  ('bl_b7_3',  'b7', 3,  5,  30, 30, '인기 스타',    '칭찬 5회 받음'),
  ('bl_b7_4',  'b7', 4,  10, 50, 50, '身邊의 천사',  '칭찬 10회 받음'),
  ('bl_b7_5',  'b7', 5,  15, 70, 70, '존경받는 사람', '칭찬 15회 받음'),
  ('bl_b7_6',  'b7', 6,  20, 100, 100, '칭찬 레전드',  '칭찬 20회 받음'),
  ('bl_b7_7',  'b7', 7,  30, 130, 130, '칭찬 요정',    '칭찬 30회 받음'),
  ('bl_b7_8',  'b7', 8,  40, 160, 160, '칭찬 성자',    '칭찬 40회 받음'),
  ('bl_b7_9',  'b7', 9,  50, 200, 200, '칭찬 전설',    '칭찬 50회 받음'),
  ('bl_b7_10', 'b7', 10, 75, 300, 300, '칭찬 완전체',  '칭찬 75회 받음')
ON CONFLICT (badge_id, level) DO UPDATE SET
  threshold = EXCLUDED.threshold,
  reward_mileage = EXCLUDED.reward_mileage,
  reward_xp = EXCLUDED.reward_xp,
  title = EXCLUDED.title,
  description = EXCLUDED.description;
