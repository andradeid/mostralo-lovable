-- Parte 1: Limpar roles duplicadas do usuário específico
DELETE FROM user_roles
WHERE user_id = '7ec2f9e3-e00b-4c12-a0b3-676d3236a849'
  AND role = 'store_admin';

-- Parte 4: Criar função para validar roles conflitantes
CREATE OR REPLACE FUNCTION validate_user_role_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  existing_role app_role;
BEGIN
  -- Verificar se usuário já tem outra role (exceto a mesma role)
  SELECT role INTO existing_role
  FROM user_roles 
  WHERE user_id = NEW.user_id 
    AND role != NEW.role
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  LIMIT 1;
  
  -- Se encontrou outra role, lançar erro
  IF existing_role IS NOT NULL THEN
    RAISE EXCEPTION 'Usuário já possui a role "%". Remova a role existente antes de adicionar uma nova.', existing_role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para validar antes de inserir ou atualizar
DROP TRIGGER IF EXISTS check_role_conflicts ON user_roles;
CREATE TRIGGER check_role_conflicts
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role_conflicts();