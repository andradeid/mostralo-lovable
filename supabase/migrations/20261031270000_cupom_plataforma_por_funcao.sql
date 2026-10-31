-- Cupons de desconto da assinatura: antes qualquer visitante lia todos os ativos (inclusive os não públicos).
-- Agora a validação usa get_platform_coupon_by_code; o público só lê os cupons marcados como públicos (banner).
create or replace function public.get_platform_coupon_by_code(p_code text)
returns setof public.coupons
language sql
stable
security definer
set search_path to 'public'
as $$
  select c.*
  from coupons c
  where length(trim(coalesce(p_code, ''))) > 0
    and upper(c.code) = upper(trim(p_code))
    and c.status::text = 'active'
  limit 1;
$$;
revoke all on function public.get_platform_coupon_by_code(text) from public;
grant execute on function public.get_platform_coupon_by_code(text) to anon, authenticated;

-- Aplicar DEPOIS do site que usa a função
alter policy "Anyone can validate coupon by code" on public.coupons to service_role;
