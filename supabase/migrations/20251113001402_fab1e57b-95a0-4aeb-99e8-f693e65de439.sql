-- ===================================================================
-- CORREÇÃO DE SEGURANÇA: Garantir que store_admins tenham store_id
-- ===================================================================

-- 1. Atualizar user_roles existentes de store_admins com o store_id correto
UPDATE user_roles ur
SET store_id = s.id
FROM stores s
WHERE ur.role = 'store_admin'
  AND ur.store_id IS NULL
  AND s.owner_id = ur.user_id;

-- 2. Criar função para validar e preencher store_id automaticamente
CREATE OR REPLACE FUNCTION validate_store_admin_store_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é store_admin e store_id é NULL, buscar automaticamente
  IF NEW.role = 'store_admin' AND NEW.store_id IS NULL THEN
    SELECT id INTO NEW.store_id
    FROM stores
    WHERE owner_id = NEW.user_id
    LIMIT 1;
    
    -- Se não encontrou loja, impedir inserção
    IF NEW.store_id IS NULL THEN
      RAISE EXCEPTION 'Store admin must have a store. Create store first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar trigger para validar antes de inserir/atualizar
DROP TRIGGER IF EXISTS validate_store_admin_store_id_trigger ON user_roles;
CREATE TRIGGER validate_store_admin_store_id_trigger
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  WHEN (NEW.role = 'store_admin')
  EXECUTE FUNCTION validate_store_admin_store_id();

-- 4. Adicionar índice para melhorar performance nas consultas de segurança
CREATE INDEX IF NOT EXISTS idx_user_roles_user_store 
  ON user_roles(user_id, store_id, role);

-- 5. Adicionar índice para queries de loja por owner
CREATE INDEX IF NOT EXISTS idx_stores_owner_id 
  ON stores(owner_id) 
  WHERE status = 'active';

-- 6. Comentários para documentação
COMMENT ON FUNCTION validate_store_admin_store_id() IS 
  'Garante que store_admins sempre tenham um store_id válido associado';

COMMENT ON TRIGGER validate_store_admin_store_id_trigger ON user_roles IS 
  'Valida e preenche automaticamente o store_id para store_admins';