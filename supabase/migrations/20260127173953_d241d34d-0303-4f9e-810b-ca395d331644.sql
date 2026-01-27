-- Limpar duplicatas mantendo apenas o primeiro registro (mais antigo; empate por id)
-- Loja: 2f2bebec-f638-4bea-825b-9c18ba719a7a

-- 1) Variantes
WITH ranked AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY store_id, lower(name), category_id
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.products
    WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
  ) t
  WHERE rn > 1
)
DELETE FROM public.product_variants
WHERE product_id IN (SELECT id FROM ranked);

-- 2) Addons
WITH ranked AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY store_id, lower(name), category_id
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.products
    WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
  ) t
  WHERE rn > 1
)
DELETE FROM public.product_addons
WHERE product_id IN (SELECT id FROM ranked);

-- 3) Produtos
WITH ranked AS (
  SELECT id
  FROM (
    SELECT
      id,
      row_number() OVER (
        PARTITION BY store_id, lower(name), category_id
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.products
    WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
  ) t
  WHERE rn > 1
)
DELETE FROM public.products
WHERE id IN (SELECT id FROM ranked);
