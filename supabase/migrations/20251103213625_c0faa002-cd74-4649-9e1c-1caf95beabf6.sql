-- Corrigir search_path da função de trigger
CREATE OR REPLACE FUNCTION update_subscription_invoices_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;