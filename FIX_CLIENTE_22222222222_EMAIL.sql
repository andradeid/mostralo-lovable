-- ============================================
-- CORREÇÃO IMEDIATA - Cliente 22222222222
-- ============================================
-- Execute no Supabase Dashboard > SQL Editor

-- PASSO 1: Verificar email atual
SELECT 
  u.id,
  u.email,
  c.name,
  c.phone,
  c.auth_user_id
FROM auth.users u
JOIN customers c ON c.auth_user_id = u.id
WHERE c.phone = '22222222222';

-- PASSO 2: Corrigir email do cliente Mulher Aranha
UPDATE auth.users
SET 
  email = 'cliente_22222222222@mostralo.me',
  updated_at = NOW()
WHERE email = 'cliente_22222222222@temp.mostralo.com';

-- PASSO 3: Verificar correção
SELECT 
  u.id,
  u.email,
  c.name,
  c.phone,
  '✅ CORRIGIDO!' as resultado
FROM auth.users u
JOIN customers c ON c.auth_user_id = u.id
WHERE c.phone = '22222222222';

-- ============================================
-- VERIFICAR OUTROS CLIENTES AFETADOS
-- ============================================

-- Listar todos os clientes com domínio antigo
SELECT 
  u.email,
  c.name,
  c.phone,
  c.created_at,
  'Precisa correção' as status
FROM auth.users u
JOIN customers c ON c.auth_user_id = u.id
WHERE u.email LIKE '%@temp.mostralo.com'
ORDER BY c.created_at DESC;

-- ============================================
-- CORREÇÃO EM MASSA (OPCIONAL)
-- ============================================
-- Descomente para atualizar TODOS os clientes com domínio antigo

/*
UPDATE auth.users
SET 
  email = REPLACE(email, '@temp.mostralo.com', '@mostralo.me'),
  updated_at = NOW()
WHERE email LIKE '%@temp.mostralo.com';
*/

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
/*
Após executar:
1. Email do cliente será atualizado de @temp.mostralo.com para @mostralo.me
2. Login com telefone 22222222222 e senha 112233 funcionará normalmente
3. Edge Function agora busca email real do auth.users dinamicamente
4. Sistema compatível com ambos os domínios (antigo e novo)
*/
