INSERT INTO public.store_sections(name)
SELECT DISTINCT category FROM public.store_products WHERE category IS NOT NULL AND trim(category) <> '' AND category <> '미분류'
ON CONFLICT DO NOTHING;
WITH ranked AS (SELECT name, row_number() OVER (ORDER BY created_at, name) - 1 AS position FROM public.store_sections)
UPDATE public.store_sections s SET sort_order = ranked.position FROM ranked WHERE ranked.name = s.name;
CREATE POLICY store_sections_update ON public.store_sections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY store_sections_delete ON public.store_sections FOR DELETE TO anon, authenticated USING (true);
GRANT UPDATE, DELETE ON public.store_sections TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.manage_store_sections(p_action text, p_name text DEFAULT NULL, p_names text[] DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_name text := trim(p_name);
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(78431, 20910);
  IF p_action = 'add' THEN
    IF v_name IS NULL OR v_name = '' OR v_name = '미분류' THEN
      RAISE EXCEPTION '섹션 이름을 입력해주세요. 미분류는 기본 섹션입니다.';
    END IF;
    INSERT INTO public.store_sections(name, sort_order)
    SELECT v_name, coalesce(max(sort_order), -1) + 1 FROM public.store_sections;
  ELSIF p_action = 'delete' THEN
    IF v_name IS NULL OR v_name = '' OR v_name = '미분류' THEN
      RAISE EXCEPTION '미분류 섹션은 삭제할 수 없습니다.';
    END IF;
    IF NOT EXISTS (SELECT FROM public.store_sections WHERE name = v_name) THEN
      RAISE EXCEPTION '존재하지 않는 섹션입니다.';
    END IF;
    UPDATE public.store_products SET category = '' WHERE category = v_name;
    DELETE FROM public.store_sections WHERE name = v_name;
  ELSIF p_action = 'reorder' THEN
    IF p_names IS NULL
       OR cardinality(p_names) <> (SELECT count(*) FROM public.store_sections)
       OR cardinality(p_names) <> (SELECT count(DISTINCT n) FROM unnest(p_names) AS n)
       OR EXISTS (SELECT FROM unnest(p_names) AS n WHERE NOT EXISTS (SELECT FROM public.store_sections s WHERE s.name = n)) THEN
      RAISE EXCEPTION '섹션 목록이 변경되었습니다. 새로고침 후 다시 시도해주세요.';
    END IF;
    UPDATE public.store_sections s SET sort_order = ordered.position - 1
    FROM unnest(p_names) WITH ORDINALITY AS ordered(name, position) WHERE s.name = ordered.name;
  ELSE
    RAISE EXCEPTION '지원하지 않는 섹션 작업입니다.';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.manage_store_sections(text,text,text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_store_sections(text,text,text[]) TO anon, authenticated;
