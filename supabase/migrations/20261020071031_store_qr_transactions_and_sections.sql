-- Existing app uses its own name/birth-date login and anon Data API access.
-- Keep SECURITY INVOKER: this function does not bypass the existing RLS.
CREATE TABLE IF NOT EXISTS public.store_sections (
  name text PRIMARY KEY CHECK (length(trim(name)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS store_sections_read ON public.store_sections;
CREATE POLICY store_sections_read ON public.store_sections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS store_sections_insert ON public.store_sections;
CREATE POLICY store_sections_insert ON public.store_sections FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT SELECT, INSERT ON public.store_sections TO anon, authenticated;
INSERT INTO public.store_sections(name)
SELECT DISTINCT category FROM public.store_products WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.process_store_product(
  p_student_id text, p_product_id text, p_request_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  v_student public.students%ROWTYPE;
  v_product public.store_products%ROWTYPE;
  v_request public.store_requests%ROWTYPE;
  v_amount integer;
  v_balance integer;
BEGIN
  IF p_request_id IS NULL OR length(p_request_id) < 8 OR length(p_request_id) > 120 THEN
    RAISE EXCEPTION '잘못된 거래 요청입니다.';
  END IF;
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id FOR UPDATE;
  IF NOT FOUND OR v_student.active IS FALSE THEN
    RAISE EXCEPTION '로그인 계정을 찾을 수 없습니다.';
  END IF;
  -- Serializing on the account prevents concurrent purchases overspending.
  SELECT * INTO v_request FROM public.store_requests WHERE id = p_request_id;
  IF FOUND THEN
    IF v_request.student_id <> p_student_id OR v_request.product_id <> p_product_id THEN
      RAISE EXCEPTION '이미 사용된 거래 요청입니다.';
    END IF;
    RETURN jsonb_build_object('name', v_request.product_name, 'amount', -v_request.mileage_cost,
      'balance', coalesce(v_student.talents, 0));
  END IF;
  SELECT * INTO v_product FROM public.store_products WHERE id = p_product_id FOR SHARE;
  IF NOT FOUND OR v_product.active IS FALSE THEN
    RAISE EXCEPTION '존재하지 않거나 비활성화된 상품입니다.';
  END IF;
  IF v_product.mileage_cost IS NULL OR v_product.mileage_cost < 0
     OR coalesce(v_product.type, 'sell') NOT IN ('buy', 'sell') THEN
    RAISE EXCEPTION '상품 가격이나 유형이 올바르지 않습니다.';
  END IF;
  v_amount := CASE WHEN v_product.type = 'buy' THEN v_product.mileage_cost ELSE -v_product.mileage_cost END;
  IF coalesce(v_student.talents, 0) + v_amount < 0 THEN
    RAISE EXCEPTION '달란트가 부족합니다. 보유: %D / 필요: %D', coalesce(v_student.talents, 0), v_product.mileage_cost;
  END IF;
  UPDATE public.students SET talents = coalesce(talents, 0) + v_amount
    WHERE id = p_student_id RETURNING talents INTO v_balance;
  INSERT INTO public.mileage_transactions(id, student_id, type, description, amount, date)
  VALUES ('store_' || p_request_id, p_student_id,
    CASE WHEN v_product.type = 'buy' THEN 'store_sale' ELSE 'store_purchase' END,
    v_product.name, v_amount, (now() AT TIME ZONE 'Asia/Seoul')::date::text);
  INSERT INTO public.store_requests(id, student_id, student_name, product_id, product_name, mileage_cost, status, reviewed_at)
  VALUES (p_request_id, p_student_id, v_student.name, p_product_id, v_product.name, -v_amount, 'approved', now());
  RETURN jsonb_build_object('name', v_product.name, 'amount', v_amount, 'balance', v_balance);
END;
$$;
REVOKE ALL ON FUNCTION public.process_store_product(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_store_product(text, text, text) TO anon, authenticated;
