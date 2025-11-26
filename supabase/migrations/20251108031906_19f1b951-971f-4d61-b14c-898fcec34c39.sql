-- ============================================
-- 1. LIMPEZA: Remover roles store_admin de usuários que têm customer
-- ============================================
DELETE FROM user_roles
WHERE role = 'store_admin'
AND user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'customer'
);

-- ============================================
-- 2. PREVENÇÃO: Função de validação de roles conflitantes
-- ============================================
CREATE OR REPLACE FUNCTION validate_conflicting_roles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se está inserindo/atualizando para 'customer'
  IF NEW.role = 'customer' THEN
    -- Verificar se o usuário já tem store_admin
    IF EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = NEW.user_id 
      AND role = 'store_admin'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Usuário não pode ter role customer e store_admin simultaneamente';
    END IF;
  END IF;

  -- Se está inserindo/atualizando para 'store_admin'
  IF NEW.role = 'store_admin' THEN
    -- Verificar se o usuário já tem customer
    IF EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = NEW.user_id 
      AND role = 'customer'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Usuário não pode ter role store_admin e customer simultaneamente';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 3. TRIGGER: Aplicar validação em INSERT/UPDATE
-- ============================================
DROP TRIGGER IF EXISTS prevent_conflicting_roles ON user_roles;

CREATE TRIGGER prevent_conflicting_roles
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_conflicting_roles();