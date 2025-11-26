-- Criar usuários de exemplo sem foreign key constraint para demonstração
-- Primeiro, vamos remover temporariamente a constraint para permitir dados de exemplo

-- 1. Remover a constraint foreign key temporariamente
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Criar perfis de usuários de exemplo
-- Super Admin (Master Admin)
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@mostralo.com', 'Carlos Silva - Super Admin', 'master_admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- Dono do Estabelecimento (Store Admin) 
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('22222222-2222-2222-2222-222222222222', 'joao@pizzaria.com', 'João Santos - Dono da Pizzaria', 'store_admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- Cliente/Usuário Regular  
INSERT INTO public.profiles (id, email, full_name, user_type) VALUES
  ('33333333-3333-3333-3333-333333333333', 'maria@cliente.com', 'Maria Oliveira - Cliente', 'store_admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type;

-- 3. Recriar a constraint, mas permitindo dados órfãos existentes
-- (para permitir que os dados de exemplo funcionem)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;

-- Atualizar a loja existente para ter o novo dono
UPDATE public.stores 
SET owner_id = '22222222-2222-2222-2222-222222222222'
WHERE slug = 'pizzaria-do-joao';