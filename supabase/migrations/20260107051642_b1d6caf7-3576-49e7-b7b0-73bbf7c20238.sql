-- Permitir que qualquer visitante veja planos de assinatura ativos
CREATE POLICY "Público pode ver planos ativos" 
ON client_subscription_plans 
FOR SELECT 
USING (is_active = true);