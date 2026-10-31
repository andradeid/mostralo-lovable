-- Cliente da loja: um token por aparelho, sem revelar dados a quem só sabe o telefone.
-- Antes: 1 token por cliente+loja, trocado a cada identificação; quem digitasse o telefone
-- recebia nome/e-mail/endereço e um token que abria todo o histórico de pedidos.
-- Agora: cada aparelho tem o seu token; "Meus pedidos" mostra os pedidos feitos com ele.

-- Vários tokens por cliente e loja (um por aparelho)
alter table public.customer_tokens drop constraint if exists unique_customer_store_token;

-- Tokens que já existiam continuam vendo o histórico como antes
alter table public.customer_tokens add column if not exists legacy boolean not null default false;
update public.customer_tokens set legacy = true;

-- Pedido sabe com qual token (aparelho) foi feito
alter table public.orders add column if not exists customer_token_id uuid
  references public.customer_tokens(id) on delete set null;
create index if not exists idx_orders_customer_token on public.orders (customer_token_id) where customer_token_id is not null;

-- Sem o "um por cliente": cada chamada cria um token novo (aparelho novo)
create or replace function public.generate_customer_token(p_customer_id uuid, p_store_id uuid)
returns table(new_token uuid, new_expires_at timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_token uuid := gen_random_uuid();
  v_expires timestamptz := now() + interval '180 days';
begin
  insert into customer_tokens (customer_id, store_id, token, expires_at)
  values (p_customer_id, p_store_id, v_token, v_expires);
  return query select v_token, v_expires;
end;
$$;

-- Só o servidor gera token (antes qualquer visitante podia chamar esta função)
revoke all on function public.generate_customer_token(uuid, uuid) from public, anon, authenticated;
grant execute on function public.generate_customer_token(uuid, uuid) to service_role;
