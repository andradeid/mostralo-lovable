
-- Liberar módulo PDV e Comandas para Stark Pizzaria
INSERT INTO store_modules (store_id, module_id, is_enabled)
VALUES (
  '79fedd36-6e19-42d6-b331-79f9ad777180',  -- Stark Pizzaria
  '2ac8acc6-0d2e-4c70-91e8-d4115ab77f16',  -- PDV e Comandas
  true
)
ON CONFLICT (store_id, module_id) DO UPDATE SET is_enabled = true;
