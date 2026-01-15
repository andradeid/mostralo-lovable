-- Adicionar política para store_admin poder atualizar tokens de profissionais da sua loja
CREATE POLICY "Store admins can update store tokens" 
ON public.google_calendar_tokens 
FOR UPDATE 
USING (
  store_id IN (
    SELECT store_id 
    FROM profiles 
    WHERE id = auth.uid() AND user_type = 'store_admin'
  )
);

-- Adicionar política para store_admin poder deletar tokens de profissionais da sua loja
CREATE POLICY "Store admins can delete store tokens" 
ON public.google_calendar_tokens 
FOR DELETE 
USING (
  store_id IN (
    SELECT store_id 
    FROM profiles 
    WHERE id = auth.uid() AND user_type = 'store_admin'
  )
);