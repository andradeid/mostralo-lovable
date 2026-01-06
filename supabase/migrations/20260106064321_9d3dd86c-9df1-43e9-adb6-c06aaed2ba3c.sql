-- Política para permitir que qualquer pessoa crie agendamentos na página pública
CREATE POLICY "Public can create bookings" ON public.bookings
  FOR INSERT
  WITH CHECK (
    -- Verifica se a loja existe e está ativa
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = store_id 
      AND stores.status = 'active'
    )
    -- O status inicial deve ser 'pending'
    AND status = 'pending'
  );