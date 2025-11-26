-- Corrigir security warning: adicionar search_path à função
CREATE OR REPLACE FUNCTION update_driver_invitations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;