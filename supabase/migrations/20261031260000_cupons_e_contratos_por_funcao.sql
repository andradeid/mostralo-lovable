-- Cupons e verificação de contrato por função no banco.
-- Antes: qualquer visitante lia os códigos de todos os cupons ativos (inclusive os "secretos")
-- e todos os contratos aceitos (nome, CPF/CNPJ, IP) de lojistas e vendedores.
-- APLICAR DEPOIS do site que chama get_promotion_by_code e verify_contract_by_hash.

-- Cupom pelo código exato, só de loja ativa e promoção ativa
create or replace function public.get_promotion_by_code(p_store_id uuid, p_code text)
returns setof public.promotions
language sql
stable
security definer
set search_path to 'public'
as $$
  select p.*
  from promotions p
  where p.store_id = p_store_id
    and p.status = 'active'
    and length(trim(coalesce(p_code, ''))) > 0
    and lower(p.code) = lower(trim(p_code))
    and public.is_active_store(p.store_id)
  limit 1;
$$;
revoke all on function public.get_promotion_by_code(uuid, text) from public;
grant execute on function public.get_promotion_by_code(uuid, text) to anon, authenticated;

-- Público vê promoções automáticas e cupons que a loja escolheu mostrar na vitrine
alter policy "Public can view active promotions" on public.promotions
  using (public.is_active_store(store_id) and (code is null or is_visible_on_store = true));

-- Verificação de contrato pelo código (hash) do comprovante
create or replace function public.verify_contract_by_hash(p_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v jsonb;
begin
  if p_hash is null or length(p_hash) < 16 then
    return null;
  end if;

  select jsonb_build_object(
    'id', m.id,
    'version', m.contract_version,
    'accepted_at', m.accepted_at,
    'holder_name', coalesce(pr.full_name, st.name),
    'holder_document', st.responsible_cpf,
    'ip_address', m.ip_address,
    'contract_type', 'merchant'
  ) into v
  from merchant_contract_acceptance m
  left join profiles pr on pr.id = m.user_id
  left join lateral (select s.name, s.responsible_cpf from stores s where s.owner_id = m.user_id limit 1) st on true
  where m.verification_hash = p_hash
  limit 1;
  if v is not null then return v; end if;

  select jsonb_build_object(
    'id', c.id,
    'version', c.version,
    'accepted_at', c.accepted_at,
    'holder_name', c.salesperson_name,
    'holder_document', c.salesperson_cnpj,
    'ip_address', c.ip_address,
    'contract_type', 'salesperson'
  ) into v
  from salesperson_contracts c
  where c.verification_hash = p_hash
  limit 1;
  return v;
end;
$$;
revoke all on function public.verify_contract_by_hash(text) from public;
grant execute on function public.verify_contract_by_hash(text) to anon, authenticated;

alter policy "Permite verificação pública por hash" on public.merchant_contract_acceptance to service_role;
alter policy "Permite verificação pública por hash" on public.salesperson_contracts to service_role;
