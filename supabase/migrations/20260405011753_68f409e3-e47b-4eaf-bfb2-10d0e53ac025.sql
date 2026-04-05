
-- ============================================
-- 1. FUNÇÕES OTIMIZADAS PARA RLS (SECURITY DEFINER + STABLE)
-- Executam com privilégios do owner, bypass RLS, e Postgres cacheia o resultado dentro da mesma query
-- ============================================

-- Verifica se o usuário atual é master_admin
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_type = 'master_admin'
  )
$$;

-- Verifica se o usuário é dono de uma loja específica
CREATE OR REPLACE FUNCTION public.is_store_owner(_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = auth.uid()
  )
$$;

-- ============================================
-- 2. ÍNDICE COMPOSTO para queries frequentes em orders
-- ============================================
CREATE INDEX IF NOT EXISTS idx_orders_store_status_created 
ON public.orders (store_id, status, created_at DESC);

-- ============================================
-- 3. SUBSTITUIR RLS POLICIES de orders (SELECT/UPDATE) para usar funções cacheadas
-- ============================================

-- DROP das policies que fazem subqueries inline
DROP POLICY IF EXISTS "Master admins podem ver todos os pedidos" ON public.orders;
DROP POLICY IF EXISTS "Master admins podem atualizar todos os pedidos" ON public.orders;
DROP POLICY IF EXISTS "Donos das lojas podem ver seus pedidos" ON public.orders;
DROP POLICY IF EXISTS "Donos das lojas podem atualizar seus pedidos" ON public.orders;

-- Recriar com funções otimizadas
CREATE POLICY "Master admins podem ver todos os pedidos"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_master_admin());

CREATE POLICY "Master admins podem atualizar todos os pedidos"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_master_admin());

CREATE POLICY "Donos das lojas podem ver seus pedidos"
ON public.orders FOR SELECT
TO authenticated
USING (public.is_store_owner(store_id));

CREATE POLICY "Donos das lojas podem atualizar seus pedidos"
ON public.orders FOR UPDATE
TO authenticated
USING (public.is_store_owner(store_id));
