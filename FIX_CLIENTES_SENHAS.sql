-- ============================================
-- ATUALIZAR SENHAS DOS CLIENTES EXISTENTES
-- ============================================
-- Execute no Supabase Dashboard > SQL Editor

-- 1️⃣ Atualizar Mulher Aranha (22222222222)
-- Criar usuário de auth se não existir ou atualizar
DO $$
DECLARE
  v_customer_id uuid;
  v_auth_user_id uuid;
  v_temp_email text := 'cliente_22222222222@temp.mostralo.com';
BEGIN
  -- Buscar cliente
  SELECT id, auth_user_id INTO v_customer_id, v_auth_user_id
  FROM customers
  WHERE phone = '22222222222';
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Cliente 22222222222 não encontrado';
  END IF;
  
  -- Se não tem auth_user_id, criar usuário
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Criando usuário de autenticação para Mulher Aranha...';
    
    -- Criar usuário via Admin API (precisa ser feito manualmente)
    RAISE NOTICE 'Cliente SEM AUTH_USER_ID - Precisa recriar conta pelo sistema';
    
  ELSE
    -- Atualizar senha do usuário existente
    RAISE NOTICE 'Atualizando senha para 112233...';
    
    UPDATE auth.users
    SET 
      encrypted_password = crypt('112233', gen_salt('bf')),
      updated_at = now()
    WHERE id = v_auth_user_id;
    
    RAISE NOTICE '✅ Senha de Mulher Aranha atualizada com sucesso!';
  END IF;
END $$;

-- 2️⃣ Atualizar Capitão América (33333333333)
DO $$
DECLARE
  v_customer_id uuid;
  v_auth_user_id uuid;
BEGIN
  -- Buscar cliente
  SELECT id, auth_user_id INTO v_customer_id, v_auth_user_id
  FROM customers
  WHERE phone = '33333333333';
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Cliente 33333333333 não encontrado';
  END IF;
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Cliente SEM AUTH_USER_ID - Precisa recriar conta pelo sistema';
  ELSE
    -- Atualizar senha
    RAISE NOTICE 'Atualizando senha para 112233...';
    
    UPDATE auth.users
    SET 
      encrypted_password = crypt('112233', gen_salt('bf')),
      updated_at = now()
    WHERE id = v_auth_user_id;
    
    RAISE NOTICE '✅ Senha de Capitão América atualizada com sucesso!';
  END IF;
END $$;

-- 3️⃣ Verificar se deu certo
SELECT 
  c.phone,
  c.name,
  c.auth_user_id,
  u.email,
  CASE 
    WHEN c.auth_user_id IS NULL THEN '⚠️ SEM AUTH - Precisa recriar'
    ELSE '✅ TEM AUTH - Senha resetada para 112233'
  END AS status
FROM customers c
LEFT JOIN auth.users u ON u.id = c.auth_user_id
WHERE c.phone IN ('22222222222', '33333333333')
ORDER BY c.phone;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- Se ambos tiverem auth_user_id:
--   ✅ Senhas resetadas para 112233
--   ✅ Podem fazer login
--
-- Se algum tiver auth_user_id = NULL:
--   ⚠️ Precisa RECRIAR conta pelo sistema
--   (Botão "Criar conta" com o mesmo telefone)
-- ============================================

