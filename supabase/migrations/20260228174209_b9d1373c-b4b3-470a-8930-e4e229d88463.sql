-- Adicionar roles faltantes para as lojas clonadas
INSERT INTO user_roles (user_id, role, store_id) VALUES 
('c9e7e489-a297-4b67-8aaa-a9b16efffd6d', 'store_admin', '05bf1934-39b8-440a-8621-640666f60cd4'),
('c9e7e489-a297-4b67-8aaa-a9b16efffd6d', 'store_admin', 'e36e65e7-0a81-48f8-9e1c-998ee37db0a7')
ON CONFLICT (user_id, role) DO NOTHING;

-- Remover o trigger que impede múltiplas roles do mesmo tipo para lojas diferentes
-- O trigger validate_user_role_conflicts bloqueia inserção de store_admin para outra loja
DROP TRIGGER IF EXISTS validate_user_role_conflicts_trigger ON user_roles;

-- Recriar a função para permitir mesma role em lojas diferentes
CREATE OR REPLACE FUNCTION public.validate_user_role_conflicts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_role app_role;
BEGIN
  -- Permitir mesma role em lojas diferentes (ex: store_admin para múltiplas lojas)
  -- Apenas bloquear roles conflitantes diferentes
  SELECT role INTO existing_role
  FROM user_roles 
  WHERE user_id = NEW.user_id 
    AND role != NEW.role
    AND role NOT IN ('master_admin')
    AND NEW.role NOT IN ('master_admin')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  LIMIT 1;
  
  IF existing_role IS NOT NULL THEN
    RAISE EXCEPTION 'Usuário já possui a role "%". Remova a role existente antes de adicionar uma nova.', existing_role;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar o trigger
CREATE TRIGGER validate_user_role_conflicts_trigger
  BEFORE INSERT OR UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role_conflicts();