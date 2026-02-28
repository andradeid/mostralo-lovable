-- Copiar módulos faltantes para Farma Bella Exemplo 2
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT 'e36e65e7-0a81-48f8-9e1c-998ee37db0a7', module_id, is_enabled
FROM store_modules
WHERE store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'
AND module_id NOT IN (
  SELECT module_id FROM store_modules WHERE store_id = 'e36e65e7-0a81-48f8-9e1c-998ee37db0a7'
)
ON CONFLICT DO NOTHING;

-- Copiar todos os módulos para Farma Bella Exemplo (que tem 0)
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT '05bf1934-39b8-440a-8621-640666f60cd4', module_id, is_enabled
FROM store_modules
WHERE store_id = '79fedd36-6e19-42d6-b331-79f9ad777180'
ON CONFLICT DO NOTHING;

-- Definir subscription_expires_at para as lojas clonadas (1 ano a partir de agora)
UPDATE stores 
SET subscription_expires_at = NOW() + INTERVAL '365 days'
WHERE id IN ('e36e65e7-0a81-48f8-9e1c-998ee37db0a7', '05bf1934-39b8-440a-8621-640666f60cd4')
AND subscription_expires_at IS NULL;