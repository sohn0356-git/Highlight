-- Fix deployed talent donation RPCs:
-- 1) qualify columns that collide with RETURNS TABLE output names
-- 2) normalize mileage transaction date type used by existing app code
-- 3) add no-sender/no-ledger admin test gifts

ALTER TABLE mileage_transactions
  ALTER COLUMN date TYPE TEXT USING date::TEXT;

ALTER TABLE talent_donations ALTER COLUMN sender_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION create_random_talent_donation(
  p_sender_id TEXT,
  p_donation_amount INTEGER,
  p_message TEXT DEFAULT ''
)
RETURNS TABLE (
  donation_id TEXT,
  sender_id TEXT,
  sender_name TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  message TEXT,
  donation_amount INTEGER,
  sender_balance_before INTEGER,
  sender_balance_after INTEGER,
  remaining_gifts_today INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_sender RECORD;
  v_recipient RECORD;
  v_sender_count INTEGER;
  v_candidate_count INTEGER;
  v_offset INTEGER;
  v_random_bytes BYTEA;
  v_random_int BIGINT;
  v_sender_after INTEGER;
  v_donation_id TEXT := 'td_' || replace(gen_random_uuid()::TEXT, '-', '');
  v_message TEXT := left(coalesce(trim(p_message), ''), 160);
BEGIN
  IF p_sender_id IS NULL OR p_sender_id = '' THEN
    RAISE EXCEPTION 'SENDER_REQUIRED';
  END IF;

  IF p_donation_amount IS NULL OR p_donation_amount <> floor(p_donation_amount) THEN
    RAISE EXCEPTION 'INVALID_DONATION_AMOUNT';
  END IF;

  IF p_donation_amount < 10 THEN
    RAISE EXCEPTION 'DONATION_TOO_SMALL';
  END IF;

  IF p_donation_amount > 100 THEN
    RAISE EXCEPTION 'DONATION_TOO_LARGE';
  END IF;

  SELECT id, name, COALESCE(talents, 0) AS talents
    INTO v_sender
    FROM students
   WHERE id = p_sender_id
   FOR UPDATE;

  IF v_sender.id IS NULL THEN
    RAISE EXCEPTION 'SENDER_NOT_FOUND';
  END IF;

  SELECT COUNT(*)
    INTO v_sender_count
    FROM talent_donations td
   WHERE td.sender_id = p_sender_id
     AND td.donation_date = v_today;

  IF v_sender_count >= 3 THEN
    RAISE EXCEPTION 'DAILY_DONATION_LIMIT_REACHED';
  END IF;

  IF v_sender.talents < p_donation_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_TALENTS';
  END IF;

  SELECT COUNT(*)
    INTO v_candidate_count
    FROM students s
   WHERE s.id <> p_sender_id
     AND COALESCE(s.active, true) = true
     AND COALESCE(s.is_teacher, false) = false
     AND s.id NOT IN (
       SELECT td.recipient_id
         FROM talent_donations td
        WHERE td.sender_id = p_sender_id
          AND td.donation_date = v_today
     );

  IF v_candidate_count <= 0 THEN
    RAISE EXCEPTION 'NO_RANDOM_RECIPIENT_AVAILABLE';
  END IF;

  v_random_bytes := gen_random_bytes(4);
  v_random_int :=
      get_byte(v_random_bytes, 0)::BIGINT * 16777216
    + get_byte(v_random_bytes, 1)::BIGINT * 65536
    + get_byte(v_random_bytes, 2)::BIGINT * 256
    + get_byte(v_random_bytes, 3)::BIGINT;
  v_offset := (v_random_int % v_candidate_count)::INTEGER;

  SELECT s.id, s.name
    INTO v_recipient
    FROM students s
   WHERE s.id <> p_sender_id
     AND COALESCE(s.active, true) = true
     AND COALESCE(s.is_teacher, false) = false
     AND s.id NOT IN (
       SELECT td.recipient_id
         FROM talent_donations td
        WHERE td.sender_id = p_sender_id
          AND td.donation_date = v_today
     )
   ORDER BY s.id
   OFFSET v_offset
   LIMIT 1;

  v_sender_after := v_sender.talents - p_donation_amount;
  UPDATE students SET talents = v_sender_after WHERE id = p_sender_id;

  INSERT INTO talent_donations (
    id, sender_id, recipient_id, message, donation_amount,
    sender_balance_before, sender_balance_after, donation_date, created_at
  )
  VALUES (
    v_donation_id, p_sender_id, v_recipient.id, v_message, p_donation_amount,
    v_sender.talents, v_sender_after, v_today, now()
  );

  INSERT INTO mileage_transactions (id, student_id, type, description, amount, date, created_at)
  VALUES (
    'tx_' || replace(gen_random_uuid()::TEXT, '-', ''),
    p_sender_id,
    '선물하기',
    v_recipient.name || '에게 랜덤 선물 보냄',
    -p_donation_amount,
    v_today::TEXT,
    now()
  );

  donation_id := v_donation_id;
  sender_id := p_sender_id;
  sender_name := v_sender.name;
  recipient_id := v_recipient.id;
  recipient_name := v_recipient.name;
  message := v_message;
  donation_amount := p_donation_amount;
  sender_balance_before := v_sender.talents;
  sender_balance_after := v_sender_after;
  remaining_gifts_today := GREATEST(0, 3 - (v_sender_count + 1));
  status := 'pending';
  created_at := now();

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION create_random_talent_donation(TEXT, INTEGER, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION create_admin_talent_gift(
  p_recipient_id TEXT,
  p_donation_amount INTEGER,
  p_message TEXT DEFAULT ''
)
RETURNS TABLE (
  donation_id TEXT,
  sender_id TEXT,
  sender_name TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  message TEXT,
  donation_amount INTEGER,
  sender_balance_before INTEGER,
  sender_balance_after INTEGER,
  remaining_gifts_today INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::date;
  v_recipient RECORD;
  v_donation_id TEXT := 'td_admin_' || replace(gen_random_uuid()::TEXT, '-', '');
  v_message TEXT := left(coalesce(trim(p_message), ''), 160);
BEGIN
  IF p_recipient_id IS NULL OR p_recipient_id = '' THEN
    RAISE EXCEPTION 'RECIPIENT_REQUIRED';
  END IF;

  IF p_donation_amount IS NULL OR p_donation_amount <> floor(p_donation_amount) THEN
    RAISE EXCEPTION 'INVALID_DONATION_AMOUNT';
  END IF;

  IF p_donation_amount < 10 THEN
    RAISE EXCEPTION 'DONATION_TOO_SMALL';
  END IF;

  IF p_donation_amount > 100 THEN
    RAISE EXCEPTION 'DONATION_TOO_LARGE';
  END IF;

  SELECT id, name
    INTO v_recipient
    FROM students
   WHERE id = p_recipient_id
     AND COALESCE(active, true) = true
   LIMIT 1;

  IF v_recipient.id IS NULL THEN
    RAISE EXCEPTION 'RECIPIENT_NOT_FOUND';
  END IF;

  INSERT INTO talent_donations (
    id, sender_id, recipient_id, message, donation_amount,
    sender_balance_before, sender_balance_after, donation_date, created_at
  )
  VALUES (
    v_donation_id, NULL, p_recipient_id, v_message, p_donation_amount,
    0, 0, v_today, now()
  );

  donation_id := v_donation_id;
  sender_id := NULL;
  sender_name := '';
  recipient_id := p_recipient_id;
  recipient_name := v_recipient.name;
  message := v_message;
  donation_amount := p_donation_amount;
  sender_balance_before := 0;
  sender_balance_after := 0;
  remaining_gifts_today := 0;
  status := 'pending';
  created_at := now();

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION create_admin_talent_gift(TEXT, INTEGER, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION open_talent_donation(
  p_recipient_id TEXT,
  p_donation_id TEXT
)
RETURNS TABLE (
  donation_id TEXT,
  sender_id TEXT,
  sender_name TEXT,
  recipient_id TEXT,
  recipient_name TEXT,
  message TEXT,
  donation_amount INTEGER,
  recipient_balance_before INTEGER,
  probability_tier TEXT,
  selected_multiplier INTEGER,
  gift_amount INTEGER,
  sender_balance_before INTEGER,
  sender_balance_after INTEGER,
  recipient_balance_after INTEGER,
  status TEXT,
  opened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_gift RECORD;
  v_recipient RECORD;
  v_sender_name TEXT;
  v_recipient_name TEXT;
  v_tier TEXT;
  v_probs INTEGER[];
  v_roll INTEGER;
  v_random_bytes BYTEA;
  v_random_int BIGINT;
  v_multiplier INTEGER;
  v_gift_amount INTEGER;
  v_recipient_after INTEGER;
  v_idx INTEGER;
  v_cursor INTEGER := 0;
BEGIN
  SELECT *
    INTO v_gift
    FROM talent_donations
   WHERE id = p_donation_id
   FOR UPDATE;

  IF v_gift.id IS NULL THEN
    RAISE EXCEPTION 'GIFT_NOT_FOUND';
  END IF;

  IF v_gift.recipient_id <> p_recipient_id THEN
    RAISE EXCEPTION 'GIFT_RECIPIENT_MISMATCH';
  END IF;

  IF v_gift.status <> 'pending' THEN
    RAISE EXCEPTION 'GIFT_ALREADY_OPENED';
  END IF;

  SELECT id, name, COALESCE(talents, 0) AS talents
    INTO v_recipient
    FROM students
   WHERE id = p_recipient_id
   FOR UPDATE;

  IF v_recipient.id IS NULL THEN
    RAISE EXCEPTION 'RECIPIENT_NOT_FOUND';
  END IF;

  SELECT name INTO v_sender_name FROM students WHERE id = v_gift.sender_id;
  v_recipient_name := v_recipient.name;

  IF v_recipient.talents <= 999 THEN
    v_tier := '0-999';
    v_probs := ARRAY[0, 5, 10, 20, 35, 30];
  ELSIF v_recipient.talents <= 1999 THEN
    v_tier := '1000-1999';
    v_probs := ARRAY[5, 10, 15, 25, 30, 15];
  ELSIF v_recipient.talents <= 2999 THEN
    v_tier := '2000-2999';
    v_probs := ARRAY[10, 15, 25, 25, 20, 5];
  ELSIF v_recipient.talents <= 3999 THEN
    v_tier := '3000-3999';
    v_probs := ARRAY[15, 25, 30, 20, 8, 2];
  ELSIF v_recipient.talents <= 5999 THEN
    v_tier := '4000-5999';
    v_probs := ARRAY[25, 35, 25, 10, 4, 1];
  ELSIF v_recipient.talents <= 7999 THEN
    v_tier := '6000-7999';
    v_probs := ARRAY[40, 40, 15, 4, 1, 0];
  ELSIF v_recipient.talents <= 9999 THEN
    v_tier := '8000-9999';
    v_probs := ARRAY[55, 35, 8, 2, 0, 0];
  ELSE
    v_tier := '10000+';
    v_probs := ARRAY[70, 25, 4, 1, 0, 0];
  END IF;

  v_random_bytes := gen_random_bytes(4);
  v_random_int :=
      get_byte(v_random_bytes, 0)::BIGINT * 16777216
    + get_byte(v_random_bytes, 1)::BIGINT * 65536
    + get_byte(v_random_bytes, 2)::BIGINT * 256
    + get_byte(v_random_bytes, 3)::BIGINT;
  v_roll := floor((v_random_int::NUMERIC / 4294967296::NUMERIC) * 100)::INTEGER;

  FOR v_idx IN 1..array_length(v_probs, 1) LOOP
    v_cursor := v_cursor + v_probs[v_idx];
    IF v_roll < v_cursor THEN
      v_multiplier := (ARRAY[50, 100, 200, 300, 500, 1000])[v_idx];
      EXIT;
    END IF;
  END LOOP;

  IF v_multiplier IS NULL THEN
    v_multiplier := 50;
  END IF;

  v_gift_amount := floor(v_gift.donation_amount * v_multiplier / 100.0)::INTEGER;
  v_recipient_after := v_recipient.talents + v_gift_amount;

  UPDATE students SET talents = v_recipient_after WHERE id = p_recipient_id;

  UPDATE talent_donations
     SET status = 'opened',
         recipient_balance_before = v_recipient.talents,
         probability_tier = v_tier,
         selected_multiplier = v_multiplier,
         gift_amount = v_gift_amount,
         recipient_balance_after = v_recipient_after,
         opened_at = now()
   WHERE id = p_donation_id;

  IF v_gift.sender_id IS NOT NULL THEN
    INSERT INTO mileage_transactions (id, student_id, type, description, amount, date, created_at)
    VALUES (
      'tx_' || replace(gen_random_uuid()::TEXT, '-', ''),
      p_recipient_id,
      '선물받기',
      coalesce(v_sender_name, '친구') || '에게 받은 랜덤 선물 ' || v_multiplier::TEXT || '%',
      v_gift_amount,
      ((now() AT TIME ZONE 'Asia/Seoul')::date)::TEXT,
      now()
    );
  END IF;

  donation_id := v_gift.id;
  sender_id := v_gift.sender_id;
  sender_name := coalesce(v_sender_name, '관리자');
  recipient_id := v_gift.recipient_id;
  recipient_name := v_recipient_name;
  message := v_gift.message;
  donation_amount := v_gift.donation_amount;
  recipient_balance_before := v_recipient.talents;
  probability_tier := v_tier;
  selected_multiplier := v_multiplier;
  gift_amount := v_gift_amount;
  sender_balance_before := v_gift.sender_balance_before;
  sender_balance_after := v_gift.sender_balance_after;
  recipient_balance_after := v_recipient_after;
  status := 'opened';
  opened_at := now();
  created_at := v_gift.created_at;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION open_talent_donation(TEXT, TEXT) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION get_talent_donation_status(p_sender_id TEXT)
RETURNS TABLE (
  donation_count_today INTEGER,
  remaining_gifts_today INTEGER,
  gifted_recipient_ids TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)::INTEGER AS donation_count_today,
    GREATEST(0, 3 - COUNT(*))::INTEGER AS remaining_gifts_today,
    COALESCE(array_agg(td.recipient_id ORDER BY td.created_at), ARRAY[]::TEXT[]) AS gifted_recipient_ids
  FROM talent_donations td
  WHERE td.sender_id = p_sender_id
    AND td.donation_date = (now() AT TIME ZONE 'Asia/Seoul')::date;
$$;

GRANT EXECUTE ON FUNCTION get_talent_donation_status(TEXT) TO anon, authenticated, service_role;
