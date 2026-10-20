-- Run after scripts/store-section-management.sql. All test changes roll back.
BEGIN;
SET LOCAL ROLE anon;
DO $test$
DECLARE
  first_name text := 'test_section_' || gen_random_uuid()::text;
  second_name text := 'test_section_' || gen_random_uuid()::text;
  product_id text := 'test_product_' || gen_random_uuid()::text;
  ordered text[];
  failed boolean := false;
BEGIN
  PERFORM public.manage_store_sections('add', first_name);
  PERFORM public.manage_store_sections('add', second_name);
  INSERT INTO public.store_products(id, name, category, mileage_cost, active, type)
    VALUES(product_id, '섹션 테스트 상품', first_name, 10, true, 'sell');
  SELECT array_agg(name ORDER BY sort_order,name) INTO ordered FROM public.store_sections WHERE name NOT IN (first_name,second_name);
  ordered := coalesce(ordered, ARRAY[]::text[]) || ARRAY[second_name,first_name];
  PERFORM public.manage_store_sections('reorder', NULL, ordered);
  ASSERT (SELECT sort_order FROM public.store_sections WHERE name=second_name) < (SELECT sort_order FROM public.store_sections WHERE name=first_name), 'order persisted';
  BEGIN
    PERFORM public.manage_store_sections('reorder', NULL, ARRAY[first_name,first_name]);
  EXCEPTION WHEN raise_exception THEN failed := true;
  END;
  ASSERT failed, 'invalid reorder rejected';
  PERFORM public.manage_store_sections('delete', first_name);
  ASSERT NOT EXISTS(SELECT FROM public.store_sections WHERE name=first_name), 'section deleted';
  ASSERT (SELECT category='' AND active AND mileage_cost=10 FROM public.store_products WHERE id=product_id), 'product preserved in uncategorized';
  PERFORM public.manage_store_sections('delete', second_name);
END;
$test$;
ROLLBACK;
