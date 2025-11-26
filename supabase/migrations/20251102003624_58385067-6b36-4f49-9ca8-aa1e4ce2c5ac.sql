-- Remover políticas duplicadas que estão causando conflitos
DROP POLICY IF EXISTS "customers_select_own_order_items" ON public.order_items;
DROP POLICY IF EXISTS "customers_select_own_order_addons" ON public.order_addons;