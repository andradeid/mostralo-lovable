-- Adicionar módulo de Chamada de Senhas como módulo independente
INSERT INTO public.modules (key, name, description, icon, is_active)
VALUES (
  'password_call',
  'Chamada de Senhas',
  'Sistema de chamada de senhas, pedidos ou mesas para exibição em TVs e painéis',
  'Megaphone',
  true
)
ON CONFLICT (key) DO NOTHING;