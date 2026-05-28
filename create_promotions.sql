-- Promoção BOGO: Compre 2 sanduíches, ganhe 50% de desconto no 2º
INSERT INTO public.promotions (
  store_id, 
  name, 
  description, 
  type, 
  scope, 
  status, 
  bogo_buy_quantity, 
  bogo_get_quantity, 
  bogo_discount_percentage,
  applies_to_delivery, 
  applies_to_pickup,
  is_visible_on_store,
  start_date
) VALUES (
  '56922778-873a-4196-8b8c-dce112d55fae',
  'Combo Sanduíche Ingá',
  'Compre 2 sanduíches e ganhe 50% de desconto no segundo!',
  'bogo',
  'category',
  'active',
  2,
  1,
  50,
  true,
  true,
  true,
  now()
) RETURNING id;

-- Associar à categoria de sanduíches
INSERT INTO public.promotion_categories (promotion_id, category_id)
SELECT 'ID_DA_PROMO_ACIMA', 'f126a901-3ac5-46db-a34c-a2697039e66e';

-- Promoção Brinde: Coca + Batata de brinde
INSERT INTO public.promotions (
  store_id, 
  name, 
  description, 
  type, 
  scope, 
  status, 
  include_free_gift,
  free_gift_products,
  applies_to_delivery, 
  applies_to_pickup,
  is_visible_on_store,
  start_date
) VALUES (
  '56922778-873a-4196-8b8c-dce112d55fae',
  'Brinde Coca + Batata',
  'Na compra de uma Coca-Cola, ganhe uma Batata Frita Simples de brinde!',
  'free_gift',
  'specific_products',
  'active',
  true,
  ARRAY['9ef31fad-7817-4bb4-97e8-0327cf4b731a']::uuid[],
  true,
  true,
  true,
  now()
) RETURNING id;

-- Associar aos produtos de Coca
INSERT INTO public.promotion_products (promotion_id, product_id)
SELECT 'ID_DA_PROMO_BRINDE', id FROM products WHERE id IN ('05d0a092-e3ac-42c8-af82-1dad566b8755', '6e57c159-60cf-4d55-afee-b21cd28c884f');
