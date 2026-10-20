BEGIN;
SET LOCAL ROLE anon;
DO $test$
DECLARE
  old_name text := 'test_rename_' || gen_random_uuid()::text;
  new_name text := 'test_rename_' || gen_random_uuid()::text;
  other_name text := 'test_rename_' || gen_random_uuid()::text;
  product_id text := 'test_product_' || gen_random_uuid()::text;
  position integer;
  failed boolean := false;
BEGIN
  PERFORM public.manage_store_sections('add', old_name);
  PERFORM public.manage_store_sections('add', other_name);
  SELECT sort_order INTO position FROM public.store_sections WHERE name=old_name;
  INSERT INTO public.store_products(id,name,category,mileage_cost,active,type)
    VALUES(product_id,'섹션 제목 테스트',old_name,50,false,'sell');
  PERFORM public.rename_store_section(old_name, '  '||new_name||'  ');
  ASSERT NOT EXISTS(SELECT FROM public.store_sections WHERE name=old_name), 'old title removed';
  ASSERT (SELECT sort_order=position FROM public.store_sections WHERE name=new_name), 'order preserved';
  ASSERT (SELECT category=new_name AND mileage_cost=50 AND NOT active FROM public.store_products WHERE id=product_id), 'including inactive products moved and preserved';
  BEGIN
    PERFORM public.rename_store_section(new_name, other_name);
  EXCEPTION WHEN raise_exception THEN failed := true;
  END;
  ASSERT failed, 'duplicate title blocked';
  ASSERT (SELECT category=new_name FROM public.store_products WHERE id=product_id), 'failed rename unchanged';
  failed := false;
  BEGIN
    PERFORM public.rename_store_section(new_name, ' ');
  EXCEPTION WHEN raise_exception THEN failed := true;
  END;
  ASSERT failed, 'empty title blocked';
  failed := false;
  BEGIN
    PERFORM public.rename_store_section(new_name, '미분류');
  EXCEPTION WHEN raise_exception THEN failed := true;
  END;
  ASSERT failed, 'reserved title blocked';
  PERFORM public.rename_store_section(new_name,new_name);
END;
$test$;
ROLLBACK;
