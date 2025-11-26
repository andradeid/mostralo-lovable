-- Adicionar política RLS para permitir leitura pública de lojas ativas
-- Necessário para a API XML/JSON funcionar sem autenticação

CREATE POLICY "Public can view active stores for XML/JSON API"
ON public.stores 
FOR SELECT
USING (status = 'active'::store_status);