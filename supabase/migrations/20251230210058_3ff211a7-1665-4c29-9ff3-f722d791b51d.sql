-- Permitir leitura pública dos status dos canais de vendas
-- Necessário para que usuários anônimos vejam se o totem/delivery/etc está pausado
-- Esta tabela contém apenas flags booleanas, não dados sensíveis

CREATE POLICY "Permitir leitura publica dos canais de vendas"
ON public.store_sales_channels
FOR SELECT
TO anon
USING (true);