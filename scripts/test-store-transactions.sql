BEGIN;
SET LOCAL ROLE anon;
DO $test$
DECLARE
  sid text := 'test_store_' || gen_random_uuid()::text;
  sell_id text := 'test_product_' || gen_random_uuid()::text;
  buy_id text := 'test_product_' || gen_random_uuid()::text;
  req text := 'test_req_' || gen_random_uuid()::text;
  result jsonb;
  failed boolean;
  balance integer;
BEGIN
  INSERT INTO public.students(id,name,birth_date,talents,active) VALUES(sid,'상점 자동 검증','2000-01-01',100,true);
  INSERT INTO public.store_products(id,name,mileage_cost,type,active)
    VALUES(sell_id,'구매 테스트',60,'sell',true),(buy_id,'판매 테스트',30,'buy',true);
  INSERT INTO public.store_sections(name) VALUES(sid);
  ASSERT EXISTS(SELECT FROM public.store_sections WHERE name=sid), 'section persistence';
  result := public.process_store_product(sid,sell_id,req);
  ASSERT (result->>'balance')::integer=40 AND (result->>'amount')::integer=-60, 'purchase';
  result := public.process_store_product(sid,sell_id,req);
  ASSERT (result->>'balance')::integer=40, 'idempotent retry';
  failed := false;
  BEGIN
    PERFORM public.process_store_product(sid,sell_id,gen_random_uuid()::text);
  EXCEPTION WHEN raise_exception THEN failed := SQLERRM LIKE '달란트가 부족%'; END;
  ASSERT failed, 'insufficient balance must fail';
  ASSERT (SELECT talents=40 FROM public.students WHERE id=sid), 'failed purchase keeps balance';
  ASSERT (SELECT count(*)=1 FROM public.store_requests WHERE student_id=sid), 'failed purchase no history';
  result := public.process_store_product(sid,buy_id,gen_random_uuid()::text);
  ASSERT (result->>'balance')::integer=70 AND (result->>'amount')::integer=30, 'sale credits account';
  UPDATE public.store_products SET mileage_cost=70 WHERE id=sell_id;
  result := public.process_store_product(sid,sell_id,gen_random_uuid()::text);
  ASSERT (result->>'balance')::integer=0, 'exact balance and latest database price';
  UPDATE public.store_products SET active=false WHERE id=buy_id;
  failed := false;
  BEGIN
    PERFORM public.process_store_product(sid,buy_id,gen_random_uuid()::text);
  EXCEPTION WHEN raise_exception THEN failed := SQLERRM LIKE '존재하지 않거나%'; END;
  ASSERT failed, 'inactive product rejected';
  UPDATE public.store_products SET active=true,mileage_cost=-1 WHERE id=buy_id;
  failed := false;
  BEGIN
    PERFORM public.process_store_product(sid,buy_id,gen_random_uuid()::text);
  EXCEPTION WHEN raise_exception THEN failed := SQLERRM LIKE '상품 가격%'; END;
  ASSERT failed, 'negative price rejected';
  UPDATE public.store_products SET mileage_cost=30 WHERE id=buy_id;
  req := gen_random_uuid()::text;
  INSERT INTO public.mileage_transactions(id,student_id,type,description,amount,date) VALUES('store_'||req,sid,'test','test',0,'2000-01-01');
  failed := false;
  BEGIN
    PERFORM public.process_store_product(sid,buy_id,req);
  EXCEPTION WHEN unique_violation THEN failed := true; END;
  ASSERT failed, 'force ledger failure';
  ASSERT (SELECT talents=0 FROM public.students WHERE id=sid), 'ledger failure rolls balance back';
  ASSERT NOT EXISTS(SELECT FROM public.store_requests WHERE id=req), 'ledger failure leaves no request';
END;
$test$;
ROLLBACK;
SELECT 'PASS: purchase, sale, insufficient balance, exact balance, current price, duplicate request, inactive/negative product, atomic rollback, section persistence (anon role)' AS result;