-- Fix RLS recursion between customers and customer_stores by using SECURITY DEFINER helper functions
-- and updating policies to avoid cross-table references that trigger recursive checks.

-- 1) Helper functions (SECURITY DEFINER) ---------------------------------------
create or replace function public.is_customer_self(_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customers c
    where c.id = _customer_id
      and c.auth_user_id = auth.uid()
  );
$$;

create or replace function public.is_store_owner_of_customer(_customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customer_stores cs
    join public.stores s on s.id = cs.store_id
    where cs.customer_id = _customer_id
      and s.owner_id = auth.uid()
  );
$$;

-- 2) Update policies to use the helper functions --------------------------------
-- customer_stores: replace policy that referenced customers directly
drop policy if exists "Customers can view their own store relationships" on public.customer_stores;
create policy "Customers can view their own store relationships"
  on public.customer_stores
  for select
  using (public.is_customer_self(customer_id));

-- customers: replace store owner policies that referenced customer_stores
drop policy if exists "Store owners can update their store customers" on public.customers;
create policy "Store owners can update their store customers"
  on public.customers
  for update
  using (public.is_store_owner_of_customer(id))
  with check (public.is_store_owner_of_customer(id));

drop policy if exists "Store owners can view their store customers" on public.customers;
create policy "Store owners can view their store customers"
  on public.customers
  for select
  using (public.is_store_owner_of_customer(id));
