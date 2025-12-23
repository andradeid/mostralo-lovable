-- =====================================================
-- FASE 1: SEGURANÇA - Habilitar RLS em tabelas de cupons
-- =====================================================

-- 1. Habilitar RLS na tabela discount_coupons
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- 2. Habilitar RLS na tabela coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA discount_coupons
-- =====================================================

-- Master admins podem ver e gerenciar todos os cupons
CREATE POLICY "Master admins manage all coupons"
ON public.discount_coupons
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master_admin'
  )
);

-- Cupons públicos e ativos podem ser lidos por qualquer usuário autenticado (para aplicação)
CREATE POLICY "Users view public active coupons"
ON public.discount_coupons
FOR SELECT
TO authenticated
USING (
  is_public = true 
  AND status = 'active'
  AND valid_from <= now() 
  AND valid_until > now()
);

-- =====================================================
-- POLÍTICAS PARA coupon_usage
-- =====================================================

-- Master admins podem ver todos os usos
CREATE POLICY "Master admins view all coupon usage"
ON public.coupon_usage
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'master_admin'
  )
);

-- Usuários podem ver seus próprios usos de cupons
CREATE POLICY "Users view own coupon usage"
ON public.coupon_usage
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Sistema pode inserir usos de cupons (via service role ou usuário autenticado)
CREATE POLICY "Authenticated users insert coupon usage"
ON public.coupon_usage
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Store admins podem ver uso de cupons de suas lojas
CREATE POLICY "Store admins view store coupon usage"
ON public.coupon_usage
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'store_admin'
  )
);