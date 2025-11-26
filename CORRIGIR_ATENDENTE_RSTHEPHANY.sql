-- ========================================
-- CORRIGIR: Atendente Sthephany Rodrigues
-- ========================================
-- Execute no Supabase SQL Editor

-- 1️⃣ Verificar se o profile existe
SELECT 
  '1️⃣ PROFILE DA ATENDENTE' as step,
  p.id,
  p.email,
  p.full_name,
  p.user_type
FROM profiles p
WHERE p.id = '29a2ac8d-232b-4761-a0ba-bc49db8cf33e';

-- 2️⃣ Verificar se existe role na user_roles
SELECT 
  '2️⃣ ROLE NA USER_ROLES' as step,
  ur.id,
  ur.user_id,
  ur.role,
  ur.store_id,
  s.name as store_name
FROM user_roles ur
LEFT JOIN stores s ON ur.store_id = s.id
WHERE ur.user_id = '29a2ac8d-232b-4761-a0ba-bc49db8cf33e';

-- 3️⃣ Inserir role de atendente se não existir
-- IMPORTANTE: Substitua 'STORE_ID_AQUI' pelo ID da loja (56922778-873a-4196-8b8c-dce112d55fae)
INSERT INTO public.user_roles (user_id, role, store_id)
SELECT 
  '29a2ac8d-232b-4761-a0ba-bc49db8cf33e'::uuid,
  'attendant'::public.app_role,
  '56922778-873a-4196-8b8c-dce112d55fae'::uuid
WHERE NOT EXISTS (
  SELECT 1 
  FROM user_roles 
  WHERE user_id = '29a2ac8d-232b-4761-a0ba-bc49db8cf33e'
    AND role = 'attendant'
)
ON CONFLICT (user_id, role, store_id) DO NOTHING;

-- 4️⃣ Atualizar user_type no profile se necessário
UPDATE profiles
SET user_type = 'attendant'
WHERE id = '29a2ac8d-232b-4761-a0ba-bc49db8cf33e'
  AND (user_type IS NULL OR user_type != 'attendant');

-- 5️⃣ Verificar correção final
SELECT 
  '5️⃣ VERIFICAÇÃO FINAL' as step,
  p.id,
  p.email,
  p.full_name,
  p.user_type,
  ur.role,
  ur.store_id,
  s.name as store_name,
  '✅ CORRIGIDO!' as status
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN stores s ON ur.store_id = s.id
WHERE p.id = '29a2ac8d-232b-4761-a0ba-bc49db8cf33e'
  AND ur.role = 'attendant';
