-- 1. Remover promoções anteriores de teste para evitar duplicidade
DELETE FROM public.promotions 
WHERE store_id = '56922778-873a-4196-8b8c-dce112d55fae' 
AND (name = 'Sanduíche: Compre 2, Ganhe 50% no 2º' OR name = 'Coca + Batata de Brinde');

-- 2. Criar a nova promoção unificada: Compre 2 Hamburgueres, Ganhe Coca + Batata
WITH new_promo_combo AS (
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
    include_free_gift,
    free_gift_products,
    applies_to_delivery, 
    applies_to_pickup,
    is_visible_on_store,
    start_date
  ) VALUES (
    '56922778-873a-4196-8b8c-dce112d55fae',
    'Combo: 2 Burgers = Coca + Batata GRÁTIS',
    'Compre 2 hambúrgueres artesanais e ganhe uma Coca-Cola e uma Batata Frita de brinde!',
    'free_gift', -- Usamos free_gift como base, mas a lógica de cálculo usará bogo_buy_quantity como gatilho
    'category',
    'active',
    2, -- Gatilho: 2 unidades
    1,
    100,
    true,
    ARRAY[
      '05d0a092-e3ac-42c8-af82-1dad566b8755', -- Coca Cola Lata
      '9ef31fad-7817-4bb4-97e8-0327cf4b731a'   -- Batata Frita Simples
    ]::uuid[],
    true,
    true,
    true,
    now()
  ) RETURNING id
)
INSERT INTO public.promotion_categories (promotion_id, category_id)
SELECT id, 'f126a901-3ac5-46db-a34c-a2697039e66e' FROM new_promo_combo;
