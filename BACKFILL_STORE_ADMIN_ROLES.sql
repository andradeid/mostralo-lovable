-- ========================================
-- BACKFILL: Sincronizar Store Admin Roles
-- ========================================
-- Execute este SQL no Supabase SQL Editor
-- Objetivo: Permitir que store_admins vejam seus atendentes

-- PASSO 1: Inserir roles faltantes
INSERT INTO public.user_roles (user_id, role, store_id)
SELECT 
  p.id as user_id,
  'store_admin'::public.app_role as role,
  s.id as store_id
FROM profiles p
INNER JOIN stores s ON s.owner_id = p.id
WHERE p.user_type = 'store_admin'
  AND NOT EXISTS (
    SELECT 1 
    FROM user_roles ur 
    WHERE ur.user_id = p.id 
      AND ur.role = 'store_admin'
      AND ur.store_id = s.id
  )
ON CONFLICT (user_id, role, store_id) DO NOTHING;

-- PASSO 2: Verificar correção para ingabeachsports@gmail.com
SELECT 
  p.email,
  p.full_name,
  p.user_type,
  ur.role,
  s.name as store_name,
  '✅ CORRIGIDO - Agora verá os atendentes!' as status
FROM profiles p
INNER JOIN user_roles ur ON p.id = ur.user_id
INNER JOIN stores s ON ur.store_id = s.id
WHERE p.email = 'ingabeachsports@gmail.com'
  AND ur.role = 'store_admin';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
/*
Email: ingabeachsports@gmail.com
Role: store_admin
Status: ✅ CORRIGIDO - Agora verá os atendentes!

PRÓXIMOS PASSOS:
1. Fazer logout do admin
2. Fazer login novamente
3. Acessar página de Atendentes
4. Os atendentes da loja aparecerão! ✅
*/
