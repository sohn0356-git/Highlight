# Supabase 연동 가이드

## 1단계: Supabase 프로젝트 생성
1. https://supabase.com/dashboard 접속
2. `New Project` 클릭
3. 프로젝트 이름: `mileage-app` (원하는 이름)
4. 데이터베이스 비밀번호 설정
5. 리전 선택 (한국에 가까운 `Northeast Asia - Tokyo` 추천)
6. `Create Project` 클릭

## 2단계: 테이블 생성
1. Supabase 대시보드 → SQL Editor → New Query
2. `lib/supabase-schema.sql` 파일 내용을 복사해서 붙여넣기
3. `Run` 버튼 클릭

## 3단계: 환경변수 설정
`.env.local` 파일을 열어서 다음 값을 입력하세요:
```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### URL과 Key 위치:
- 대시보드 → Settings → API
- `Project URL`: `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key`: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4단계: 데모 데이터 삽입
테이블을 만든 후, 다음 SQL을 실행해서 데모 데이터를 넣으세요:

```sql
-- Classes
INSERT INTO classes (id, name, level, xp, weekly_xp, attendance_attended, attendance_total, qt_count, mission_count, prayer_count, class_message)
VALUES
  ('c1', '고2-3반', 7, 12450, 620, 11, 13, 37, 21, 18, '이번 주도 서로를 위해 기도해요 🙏'),
  ('c2', '고1-2반', 6, 11920, 540, 9, 13, 28, 15, 10, '서로 돕고 성장하는 반!');
  INSERT INTO classes (id, name, level, xp, weekly_xp) VALUES
  ('c3','고3-1반',5,10840,380),
  ('c4','고1-4반',4,10120,1420),
  ('c5','고2-1반',4,9720,490),
  ('c6','고3-2반',3,8950,310);

-- Students
INSERT INTO students (id, name, birth_date, class_id, mileage) VALUES
  ('s1','홍길동','2009-03-15','c1',1420),
  ('s2','김민준','2008-11-22','c1',980),
  ('s3','이서연','2009-07-04','c1',1100),
  ('s4','박지호','2008-02-10','c1',870),
  ('s5','최수진','2009-09-30','c1',1350),
  ('s6','정하은','2008-05-18','c1',1020),
  ('s7','강이준','2009-01-25','c2',950),
  ('s8','한지우','2009-06-12','c2',1180),
  ('s9','윤서준','2008-08-03','c3',870),
  ('s10','오다은','2009-12-19','c3',1050),
  ('s11','노현서','2009-04-22','c4',1300),
  ('s12','임도윤','2008-10-07','c5',920),
  ('s13','신예린','2009-08-28','c6',1150),
  ('s14','장도현','2008-12-14','c4',1080),
  ('s15','문시은','2009-03-09','c1',1200);

-- Today's QT
INSERT INTO qt_today (id, date, passage, verse, content) VALUES
  ('current', '2026-08-30', '빌립보서 4:6-7', '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라.', '바울은 빌립보 교회에 염려를 내려놓고 기도하라고 권면합니다.');

-- Shared goal
INSERT INTO shared_goal (id, label, current_xp, target_xp, reward) VALUES
  ('current', '고등부 공동 목표', 48350, 60000, '60,000 XP 달성하면 예배 후 전체 아이스크림 🍦');
```

## 5단계: 앱 실행
```bash
npm run dev
```

## 작동 방식
- `.env.local`에 URL/key가 있으면 Supabase에서 데이터를 읽고 씀
- 값이 없으면 로컬 mock 데이터(localStorage)로 동작
- 백엔드를 나중에 연결할 때 `.env.local`만 수정하면 됨

## 주의사항
- 현재 RLS 정책은 "모든 허용" 상태입니다 (개발용)
- 실제 서비스 전환 시 인증된 사용자만 읽도록 정책을 변경하세요
- `fetchStudents()` 함수에서 `eq("name", name.trim())`이 사용되므로, 로그인 성공 시 즉시 학생 정보가 Supabase에서 로드됩니다
