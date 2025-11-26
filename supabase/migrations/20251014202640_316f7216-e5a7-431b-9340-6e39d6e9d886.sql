-- Security Fix: Restrict customer and order creation to authenticated users only

-- 1. Fix customer table - Remove public insertion policy
DROP POLICY IF EXISTS "Public can create customers" ON public.customers;

-- Allow authenticated users to create their own customer profile
CREATE POLICY "Authenticated users can create their own customer profile"
ON public.customers FOR INSERT
WITH CHECK (auth_user_id = auth.uid());

-- Allow store owners to create customers for their stores
CREATE POLICY "Store owners can create customers for their stores"
ON public.customers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_id = auth.uid()
  )
);

-- 2. Fix orders table - Remove public insertion policy
DROP POLICY IF EXISTS "Público pode criar pedidos" ON public.orders;

-- Allow authenticated customers to create their own orders
CREATE POLICY "Authenticated customers create orders"
ON public.orders FOR INSERT
WITH CHECK (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE auth_user_id = auth.uid()
  )
);

-- Allow store owners to create orders for their stores
CREATE POLICY "Store owners create orders for their stores"
ON public.orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = orders.store_id
    AND owner_id = auth.uid()
  )
);

-- 3. Fix Security Definer View issue
DROP VIEW IF EXISTS public.public_stores;

-- Recreate view WITHOUT security definer
CREATE VIEW public.public_stores AS
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  cover_url,
  phone,
  address,
  city,
  state,
  business_hours,
  theme_colors,
  status,
  created_at
FROM public.stores
WHERE status = 'active';

-- Grant access to the view
GRANT SELECT ON public.public_stores TO anon, authenticated;