
-- Ativar módulo KDS para a loja Drogaria Farma Bella
UPDATE public.store_modules
SET is_enabled = true
WHERE store_id = '2f2bebec-f638-4bea-825b-9c18ba719a7a'
  AND module_id = 'e56f8c46-69e8-4e7c-8b8e-c3545ba13c63';
