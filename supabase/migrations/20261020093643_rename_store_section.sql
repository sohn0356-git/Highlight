CREATE OR REPLACE FUNCTION public.rename_store_section(p_old_name text, p_new_name text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_old text := trim(p_old_name); v_new text := trim(p_new_name);
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(78431, 20910);
  IF v_old IS NULL OR v_old = '' OR v_old = '미분류' OR v_new IS NULL OR v_new = '' OR v_new = '미분류' THEN
    RAISE EXCEPTION '섹션 이름을 입력해주세요. 미분류는 기본 섹션입니다.';
  END IF;
  IF NOT EXISTS (SELECT FROM public.store_sections WHERE name = v_old) THEN
    RAISE EXCEPTION '존재하지 않는 섹션입니다.';
  END IF;
  IF v_old = v_new THEN RETURN; END IF;
  IF EXISTS (SELECT FROM public.store_sections WHERE name = v_new) THEN
    RAISE EXCEPTION '이미 존재하는 섹션입니다.';
  END IF;
  UPDATE public.store_sections SET name = v_new WHERE name = v_old;
  UPDATE public.store_products SET category = v_new WHERE category = v_old;
END;
$$;
REVOKE ALL ON FUNCTION public.rename_store_section(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_store_section(text,text) TO anon, authenticated;
