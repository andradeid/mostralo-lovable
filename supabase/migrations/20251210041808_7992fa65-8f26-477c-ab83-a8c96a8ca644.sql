-- Permitir que visitantes anônimos vejam dados de contato para o formulário de leads
CREATE POLICY "Visitantes podem ver dados de contato"
ON subscription_payment_config
FOR SELECT
TO anon
USING (is_active = true);