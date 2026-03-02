-- Adicionar get_last_delivery_info ao enabled_tools de TODOS os modos do nicho Farmácia
UPDATE niche_ai_configs
SET enabled_tools = array_append(enabled_tools, 'get_last_delivery_info'),
    updated_at = now()
WHERE id IN (
  'a1000000-0000-0000-0000-000000000001',
  '90a8ab74-6987-4cb0-b69c-63213ac728f5',
  'f59b92b2-920f-4752-a45a-cfc6a15421de'
)
AND NOT ('get_last_delivery_info' = ANY(enabled_tools));