-- Policy para cliente cancelar seus próprios agendamentos
-- Limitado a: só pode mudar status para 'cancelled'
CREATE POLICY "Customer can cancel own bookings"
  ON public.bookings FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'cancelled'
    AND customer_id IN (
      SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
  );