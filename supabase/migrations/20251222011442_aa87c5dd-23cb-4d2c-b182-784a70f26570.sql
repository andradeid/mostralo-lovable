-- Inserir password_call para todas as lojas que têm digital_signage ativo
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT 
  sm.store_id,
  (SELECT id FROM modules WHERE key = 'password_call'),
  true
FROM store_modules sm
JOIN modules m ON m.id = sm.module_id
WHERE m.key = 'digital_signage' 
  AND sm.is_enabled = true
ON CONFLICT (store_id, module_id) DO NOTHING;