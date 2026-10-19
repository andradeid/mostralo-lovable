-- Lista de clientes da loja numa consulta só (a tela fazia 3 consultas por cliente com RLS pesado).
create or replace function public.get_store_customers(p_store_id uuid)
returns table (
  id uuid, name text, phone text, email text, address text, auth_user_id uuid, created_at timestamptz,
  order_count bigint, booking_count bigint
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.is_store_owner(p_store_id) or public.is_attendant_for_order_store(p_store_id) or public.is_master_admin()) then
    raise exception 'Sem acesso a esta loja' using errcode = '42501';
  end if;
  return query
  with o as (
    select ord.customer_id, count(*) as n,
           (array_agg(ord.customer_address order by ord.created_at desc) filter (where ord.customer_address is not null))[1] as last_address
    from orders ord where ord.store_id = p_store_id and ord.customer_id is not null group by ord.customer_id
  ), b as (
    select bk.customer_id, count(*) as n
    from bookings bk where bk.store_id = p_store_id and bk.customer_id is not null group by bk.customer_id
  )
  select c.id, c.name, c.phone, c.email, coalesce(c.address, o.last_address), c.auth_user_id, c.created_at,
         coalesce(o.n, 0), coalesce(b.n, 0)
  from customers c
  left join o on o.customer_id = c.id
  left join b on b.customer_id = c.id
  where o.customer_id is not null or b.customer_id is not null
  order by c.created_at desc;
end $$;
revoke all on function public.get_store_customers(uuid) from public, anon;
grant execute on function public.get_store_customers(uuid) to authenticated;
