-- Atribuir módulo password_call a TODAS as lojas existentes
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT 
  s.id,
  (SELECT id FROM modules WHERE key = 'password_call'),
  true
FROM stores s
ON CONFLICT (store_id, module_id) DO NOTHING;