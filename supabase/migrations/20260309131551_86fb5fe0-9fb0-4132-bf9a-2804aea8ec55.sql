
-- Permitir atendentes lerem whatsapp_instances da sua loja
CREATE POLICY "Attendants can view whatsapp instances of their store"
ON whatsapp_instances FOR SELECT
USING (
  is_attendant_of_store_direct(store_id, auth.uid())
);
