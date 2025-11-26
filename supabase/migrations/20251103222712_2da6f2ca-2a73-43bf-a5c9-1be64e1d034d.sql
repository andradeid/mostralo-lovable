-- Permitir que todos os usuários autenticados vejam planos ativos
CREATE POLICY "Public can view active plans"
ON plans
FOR SELECT
USING (status = 'active');