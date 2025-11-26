-- Parte 1: Manter user_type válido mas adicionar flag de deprecated
-- Não vamos alterar o user_type, mas a lógica do código vai ignorá-lo

-- Verificar e reportar inconsistências (apenas log)
DO $$
DECLARE
  v_count integer;
  v_record record;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id
  WHERE p.user_type IS NOT NULL 
    AND ur.role IS NOT NULL
    AND p.user_type::text != ur.role::text;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Atenção: Existem % perfis com user_type diferente de user_roles. O sistema agora usa APENAS user_roles.', v_count;
  END IF;
END $$;

-- Parte 4: Depreciar o campo user_type
COMMENT ON COLUMN profiles.user_type IS 'DEPRECATED: Use a tabela user_roles ao invés deste campo. Este campo é mantido apenas para compatibilidade legada e será ignorado pela aplicação.';

-- Criar função para avisar sobre uso de user_type
CREATE OR REPLACE FUNCTION warn_user_type_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.user_type IS NULL OR OLD.user_type != NEW.user_type) THEN
    RAISE WARNING 'O campo user_type está deprecated. Use a tabela user_roles para gerenciar permissões. O valor de user_type será ignorado pela aplicação.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para avisar quando user_type for usado
DROP TRIGGER IF EXISTS warn_on_user_type_update ON profiles;
CREATE TRIGGER warn_on_user_type_update
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.user_type IS NOT NULL)
  EXECUTE FUNCTION warn_user_type_usage();