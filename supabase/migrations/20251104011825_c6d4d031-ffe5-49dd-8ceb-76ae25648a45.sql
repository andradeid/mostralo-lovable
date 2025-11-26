-- Corrigir função para ter search_path seguro
CREATE OR REPLACE FUNCTION warn_user_type_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.user_type IS NULL OR OLD.user_type != NEW.user_type) THEN
    RAISE WARNING 'O campo user_type está deprecated. Use a tabela user_roles para gerenciar permissões. O valor de user_type será ignorado pela aplicação.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;