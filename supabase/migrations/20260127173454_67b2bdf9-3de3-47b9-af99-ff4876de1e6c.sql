
-- Deletar produtos duplicados, mantendo o mais antigo (primeira importação)
-- Primeiro deletar variantes dos produtos que serão removidos
DELETE FROM product_variants 
WHERE product_id IN (
  SELECT p.id
  FROM products p
  INNER JOIN (
    SELECT name, category_id, MIN(created_at) as first_created
    FROM products 
    WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
    GROUP BY name, category_id
    HAVING COUNT(*) > 1
  ) dup ON p.name = dup.name 
       AND p.category_id = dup.category_id 
       AND p.created_at > dup.first_created
  WHERE p.store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
);

-- Deletar addons dos produtos que serão removidos
DELETE FROM product_addons 
WHERE product_id IN (
  SELECT p.id
  FROM products p
  INNER JOIN (
    SELECT name, category_id, MIN(created_at) as first_created
    FROM products 
    WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
    GROUP BY name, category_id
    HAVING COUNT(*) > 1
  ) dup ON p.name = dup.name 
       AND p.category_id = dup.category_id 
       AND p.created_at > dup.first_created
  WHERE p.store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
);

-- Agora deletar os produtos duplicados
DELETE FROM products 
WHERE id IN (
  SELECT p.id
  FROM products p
  INNER JOIN (
    SELECT name, category_id, MIN(created_at) as first_created
    FROM products 
    WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
    GROUP BY name, category_id
    HAVING COUNT(*) > 1
  ) dup ON p.name = dup.name 
       AND p.category_id = dup.category_id 
       AND p.created_at > dup.first_created
  WHERE p.store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
);
