-- Inserir planos Essencial e Profissional com todos os recursos

-- 1. Inserir plano Essencial (R$ 397,90)
INSERT INTO plans (name, price, description, features, is_popular, status, billing_cycle, max_products, max_categories, promotion_active)
VALUES (
  'Essencial', 
  397.90, 
  'Tudo que você precisa para começar',
  '["Cardápio Digital Ilimitado", "0% Taxa por Pedido", "Pedidos WhatsApp", "Gestão de Clientes", "Relatórios Básicos", "Marketing Digital Incluso", "1 Perfil de Rede Social", "Agendamento Ilimitado de Posts", "IA para Legendas"]'::jsonb,
  false, 
  'active', 
  'monthly',
  9999,
  9999,
  false
)
ON CONFLICT DO NOTHING;

-- 2. Inserir plano Profissional (R$ 597,90)
INSERT INTO plans (name, price, description, features, is_popular, status, billing_cycle, max_products, max_categories, promotion_active)
VALUES (
  'Profissional', 
  597.90, 
  'O mais escolhido pelos restaurantes',
  '["Tudo do Essencial", "IA WhatsApp 24/7", "App para Entregadores", "KDS Cozinha", "Kanban de Pedidos", "Cálculo Frete Automático", "Relatórios com IA", "Marketing Digital Incluso", "1 Perfil de Rede Social", "Agendamento Ilimitado de Posts", "Análise de Concorrentes"]'::jsonb,
  true, 
  'active', 
  'monthly',
  9999,
  9999,
  false
)
ON CONFLICT DO NOTHING;

-- 3. Atualizar Premium para features corretas e tornar is_popular = false
UPDATE plans SET 
  features = '["Tudo do Profissional", "Multi-lojas", "API Personalizada", "White Label", "Integração ERP", "Suporte 24/7 Dedicado", "Gerente de Conta", "Marketing Digital Incluso", "1 Perfil de Rede Social", "Agendamento Ilimitado de Posts", "Relatórios Avançados de Marketing"]'::jsonb,
  is_popular = false
WHERE name = 'Premium' AND status = 'active';