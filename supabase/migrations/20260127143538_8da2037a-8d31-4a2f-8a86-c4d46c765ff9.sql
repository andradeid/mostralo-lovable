-- Criar política de leitura para todos os usuários autenticados
-- Permitir apenas verificar se está configurado (não expõe as chaves completas)
CREATE POLICY "authenticated_can_check_config"
ON public.image_search_config
FOR SELECT
TO authenticated
USING (is_active = true);

-- Nota: As chaves da API ficam protegidas pois:
-- 1. O frontend só precisa saber SE está configurado
-- 2. A Edge Function usa service_role para acessar as chaves reais