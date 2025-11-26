-- Criar perfis de usuários de exemplo
-- Nota: Estes são perfis fictícios. Para conectar a usuários reais, 
-- será necessário fazer signup via interface e depois atualizar os IDs

-- 1. Super Admin (Master Admin)
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@mostralo.com', 'Carlos Silva - Super Admin', 'master_admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- 2. Dono do Estabelecimento (Store Admin) 
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('22222222-2222-2222-2222-222222222222', 'joao@pizzaria.com', 'João Santos - Dono da Pizzaria', 'store_admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- 3. Cliente/Usuário Regular
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('33333333-3333-3333-3333-333333333333', 'maria@cliente.com', 'Maria Oliveira - Cliente', 'store_admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- Atualizar a loja existente para ter o novo dono
UPDATE public.stores 
SET owner_id = '22222222-2222-2222-2222-222222222222'
WHERE slug = 'pizzaria-do-joao';

-- Criar uma segunda loja para o exemplo
INSERT INTO public.stores (id, owner_id, plan_id, name, slug, description, phone, address, status) 
SELECT 
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  p.id,
  'Hamburgueria do José',
  'hamburgueria-do-jose',
  'Os melhores hamburgers artesanais da região',
  '(11) 88888-8888',
  'Av. dos Sabores, 456 - Vila Gourmet',
  'active'
FROM public.plans p WHERE p.name = 'Básico'
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address;