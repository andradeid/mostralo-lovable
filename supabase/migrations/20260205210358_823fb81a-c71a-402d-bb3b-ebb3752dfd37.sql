-- Permitir que usuários anônimos/públicos criem registros de clientes
-- Necessário para que o agendamento online funcione sem login
CREATE POLICY "Public can create customers for booking"
ON public.customers
FOR INSERT
TO public
WITH CHECK (
  -- Apenas permitir criação se auth_user_id for NULL (cliente anônimo)
  auth_user_id IS NULL
);