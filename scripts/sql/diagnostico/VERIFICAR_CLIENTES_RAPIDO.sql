-- ============================================
-- VERIFICAÇÃO RÁPIDA - CLIENTES 22222222222 e 33333333333
-- ============================================
-- Execute no Supabase Dashboard > SQL Editor
-- E me envie o resultado!

-- Verificar se os clientes existem e têm auth_user_id
SELECT 
  phone,
  name,
  email,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '🚨 SEM AUTH - NÃO PODE LOGAR'
    ELSE '✅ TEM AUTH - PODE LOGAR'
  END AS status,
  created_at
FROM customers
WHERE phone IN ('22222222222', '33333333333')
ORDER BY phone;

-- Se não retornar nenhuma linha = CLIENTES NÃO EXISTEM (precisam se cadastrar)
-- Se retornar com auth_user_id = NULL = CLIENTES PRECISAM RECRIAR CONTA COM SENHA
-- Se retornar com auth_user_id preenchido = PROBLEMA É OUTRO (provavelmente senha)

