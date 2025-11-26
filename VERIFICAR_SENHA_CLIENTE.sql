-- ============================================
-- VERIFICAR COMO O CLIENTE FOI CRIADO
-- ============================================

-- 1. Verificar dados do cliente
SELECT 
  'DADOS DO CLIENTE' AS info,
  id,
  name,
  phone,
  email,
  auth_user_id,
  created_at
FROM customers
WHERE phone = '33333333333';

-- 2. Verificar o usuário de auth associado
SELECT 
  'USUARIO AUTH' AS info,
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at,
  u.raw_user_meta_data
FROM auth.users u
WHERE u.id IN (
  SELECT auth_user_id 
  FROM customers 
  WHERE phone = '33333333333'
);

-- 3. Verificar se o email de autenticação está correto
-- O email deve ser: cliente_33333333333@temp.mostralo.com
SELECT 
  'VERIFICACAO EMAIL' AS info,
  u.email,
  CASE 
    WHEN u.email = 'cliente_33333333333@temp.mostralo.com' THEN '✅ Email correto'
    ELSE '⚠️ Email diferente - pode ser o problema!'
  END AS status
FROM auth.users u
WHERE u.id IN (
  SELECT auth_user_id 
  FROM customers 
  WHERE phone = '33333333333'
);

-- ============================================
-- SOLUÇÃO 1: Se o email estiver diferente
-- ============================================
-- O cliente precisa RECRIAR a conta com senha
-- Use o botão "Criar conta" no sistema

-- ============================================
-- SOLUÇÃO 2: Resetar a senha manualmente
-- ============================================
-- Execute isso para definir a senha como 112233:

/*
-- ATENÇÃO: Isso define a senha como 112233
-- Descomente para executar:

UPDATE auth.users
SET 
  encrypted_password = crypt('112233', gen_salt('bf')),
  updated_at = now()
WHERE email = 'cliente_33333333333@temp.mostralo.com';
*/

-- ============================================
-- SOLUÇÃO 3: Criar novo cliente de teste
-- ============================================
-- Crie um novo cliente usando o sistema:
-- 1. Botão "Criar conta"
-- 2. Use telefone: 44444444444
-- 3. Defina senha: 112233
-- 4. Teste com esse cliente novo

