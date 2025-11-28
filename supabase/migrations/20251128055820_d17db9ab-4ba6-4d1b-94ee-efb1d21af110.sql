-- Desativar plano Free
UPDATE plans SET status = 'inactive' WHERE name = 'Free';

-- Atualizar plano Professional para Essencial (R$ 397,90)
UPDATE plans SET 
  name = 'Essencial',
  price = 397.90,
  description = 'Tudo que você precisa para começar',
  features = '["Cardápio Digital Ilimitado", "0% Taxa por Pedido", "Pedidos WhatsApp", "Gestão de Clientes", "Relatórios Básicos", "Marketing Digital Incluso", "1 Perfil de Rede Social", "Agendamento Ilimitado de Posts", "IA para Legendas"]'::jsonb,
  status = 'active',
  is_popular = false,
  billing_cycle = 'monthly',
  max_products = 9999,
  max_categories = 9999
WHERE name = 'Professional';

-- Criar plano Profissional (R$ 597,90) - novo plano
INSERT INTO plans (
  name, 
  price, 
  description, 
  features, 
  is_popular, 
  status, 
  billing_cycle, 
  max_products, 
  max_categories
)
SELECT
  'Profissional', 
  597.90, 
  'O mais escolhido pelos restaurantes',
  '["Tudo do Essencial", "IA WhatsApp 24/7", "App para Entregadores", "KDS Cozinha", "Kanban de Pedidos", "Cálculo Frete Automático", "Relatórios com IA", "Marketing Digital Incluso", "1 Perfil de Rede Social", "Agendamento Ilimitado de Posts", "Análise de Concorrentes"]'::jsonb,
  true, 
  'active', 
  'monthly',
  9999,
  9999
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Profissional');

-- Atualizar plano Premium (R$ 997,90)
UPDATE plans SET 
  price = 997.90,
  description = 'Para operações que querem escalar',
  features = '["Tudo do Profissional", "Multi-lojas", "API Personalizada", "White Label", "Integração ERP", "Suporte 24/7 Dedicado", "Gerente de Conta", "Marketing Digital Incluso", "1 Perfil de Rede Social", "Agendamento Ilimitado de Posts", "Relatórios Avançados de Marketing"]'::jsonb,
  promotion_active = false,
  discount_price = NULL,
  discount_percentage = NULL,
  promotion_label = NULL,
  promotion_start_date = NULL,
  promotion_end_date = NULL,
  status = 'active'
WHERE name = 'Premium';