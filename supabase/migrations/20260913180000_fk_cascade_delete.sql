-- 관리자 삭제 버튼이 FK 하위 데이터까지 함께 삭제하도록 ON DELETE CASCADE로 전환
-- (학생 삭제 시 출석·QT·기도·포인트·칭찬 등 관련 기록도 자동 삭제)

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES attendance_sessions(id) ON DELETE CASCADE;

ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE completed_missions DROP CONSTRAINT IF EXISTS completed_missions_student_id_fkey;
ALTER TABLE completed_missions ADD CONSTRAINT completed_missions_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE mileage_transactions DROP CONSTRAINT IF EXISTS mileage_transactions_student_id_fkey;
ALTER TABLE mileage_transactions ADD CONSTRAINT mileage_transactions_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE prayer_participants DROP CONSTRAINT IF EXISTS prayer_participants_prayer_id_fkey;
ALTER TABLE prayer_participants ADD CONSTRAINT prayer_participants_prayer_id_fkey FOREIGN KEY (prayer_id) REFERENCES prayer_requests(id) ON DELETE CASCADE;

ALTER TABLE prayer_participants DROP CONSTRAINT IF EXISTS prayer_participants_student_id_fkey;
ALTER TABLE prayer_participants ADD CONSTRAINT prayer_participants_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE prayer_requests DROP CONSTRAINT IF EXISTS prayer_requests_author_id_fkey;
ALTER TABLE prayer_requests ADD CONSTRAINT prayer_requests_author_id_fkey FOREIGN KEY (author_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE qt_comments DROP CONSTRAINT IF EXISTS qt_comments_post_id_fkey;
ALTER TABLE qt_comments ADD CONSTRAINT qt_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES shared_qt_posts(id) ON DELETE CASCADE;

ALTER TABLE qt_comments DROP CONSTRAINT IF EXISTS qt_comments_student_id_fkey;
ALTER TABLE qt_comments ADD CONSTRAINT qt_comments_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE qt_records DROP CONSTRAINT IF EXISTS qt_records_student_id_fkey;
ALTER TABLE qt_records ADD CONSTRAINT qt_records_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE shared_qt_posts DROP CONSTRAINT IF EXISTS shared_qt_posts_student_id_fkey;
ALTER TABLE shared_qt_posts ADD CONSTRAINT shared_qt_posts_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

ALTER TABLE store_requests DROP CONSTRAINT IF EXISTS store_requests_product_id_fkey;
ALTER TABLE store_requests ADD CONSTRAINT store_requests_product_id_fkey FOREIGN KEY (product_id) REFERENCES store_products(id) ON DELETE CASCADE;
