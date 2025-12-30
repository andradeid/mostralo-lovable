-- Permitir que usuários autenticados leiam os canais de vendas
-- Necessário para que clientes logados vejam se o serviço está pausado
CREATE POLICY "Permitir leitura autenticada dos canais de vendas"
ON public.store_sales_channels
FOR SELECT
TO authenticated
USING (true);