-- Inserir módulo de integração iFood
INSERT INTO modules (key, name, description, icon, is_active)
VALUES (
  'ifood_integration',
  'Integração iFood',
  'Receba pedidos automaticamente do iFood na sua loja',
  'Utensils',
  true
)
ON CONFLICT (key) DO NOTHING;