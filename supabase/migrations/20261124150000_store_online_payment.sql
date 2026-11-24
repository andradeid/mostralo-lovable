-- Checkout da loja: saber se a loja recebe online pelo Mercado Pago, sem expor credenciais.
create or replace function public.store_online_payment(p_store_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'mercado_pago', exists (
      select 1 from store_payment_gateways g
       where g.store_id = p_store_id and g.gateway = 'mercado_pago'
         and g.is_active and g.is_validated
    )
  );
$$;
revoke all on function public.store_online_payment(uuid) from public;
grant execute on function public.store_online_payment(uuid) to anon, authenticated;
