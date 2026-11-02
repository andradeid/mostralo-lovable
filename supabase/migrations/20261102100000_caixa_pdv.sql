-- Abertura e fechamento de caixa do PDV (02/11/2026).
-- Nada roda a cada venda: o resumo soma as comandas fechadas entre a abertura e o fechamento
-- (uma consulta só, na hora de conferir/fechar). Um caixa aberto por loja (índice único parcial).
-- Opcional por loja: stores.pdv_require_open_cash = exige caixa aberto para fechar venda/comanda.

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  opened_by uuid,
  opening_amount numeric(12,2) not null default 0 check (opening_amount >= 0),
  opening_notes text,
  closed_at timestamptz,
  closed_by uuid,
  counted_amount numeric(12,2),
  expected_cash numeric(12,2),
  difference numeric(12,2),
  summary jsonb,
  closing_notes text,
  created_at timestamptz not null default now()
);

create unique index if not exists cash_sessions_one_open_per_store
  on public.cash_sessions (store_id) where status = 'open';
create index if not exists cash_sessions_store_opened_idx
  on public.cash_sessions (store_id, opened_at desc);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cash_sessions(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  type text not null check (type in ('sangria', 'suprimento')),
  amount numeric(12,2) not null check (amount > 0),
  reason text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists cash_movements_session_idx on public.cash_movements (session_id, created_at);

-- Para o resumo: comandas fechadas por loja e horário de fechamento
create index if not exists comandas_store_closed_at_idx
  on public.comandas (store_id, closed_at) where status = 'closed';

alter table public.stores
  add column if not exists pdv_require_open_cash boolean not null default false;
comment on column public.stores.pdv_require_open_cash is
  'PDV: exige caixa aberto para fechar venda/comanda (opcional; padrão desligado).';

-- Leitura: quem opera a loja (dono, admin, atendente, master). Gravação só pelas funções abaixo.
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;

create policy "Store team can read cash sessions" on public.cash_sessions
  for select to authenticated using (public._can_operate_store(store_id));

create policy "Store team can read cash movements" on public.cash_movements
  for select to authenticated using (public._can_operate_store(store_id));

revoke insert, update, delete on public.cash_sessions, public.cash_movements from anon, authenticated;
revoke all on public.cash_sessions, public.cash_movements from anon;

-- ── Resumo do caixa (vendas por forma de pagamento + sangrias/suprimentos + dinheiro esperado) ──
create or replace function public.cash_session_summary(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  s record;
  v_until timestamptz;
  v_by_method jsonb;
  v_sales_total numeric := 0;
  v_sales_count int := 0;
  v_cash_sales numeric := 0;
  v_discounts numeric := 0;
  v_service_fee numeric := 0;
  v_sangrias numeric := 0;
  v_suprimentos numeric := 0;
begin
  select * into s from cash_sessions where id = p_session_id;
  if not found then raise exception 'Caixa não encontrado'; end if;
  if not public._can_operate_store(s.store_id) then raise exception 'Sem permissão para este caixa'; end if;

  v_until := coalesce(s.closed_at, now());

  select coalesce(jsonb_object_agg(m, jsonb_build_object('total', t, 'count', c)), '{}'::jsonb),
         coalesce(sum(t), 0), coalesce(sum(c), 0)::int
    into v_by_method, v_sales_total, v_sales_count
    from (
      select coalesce(nullif(payment_method, ''), 'outro') m, round(sum(total), 2) t, count(*) c
        from comandas
       where store_id = s.store_id and status = 'closed'
         and closed_at >= s.opened_at and closed_at <= v_until
       group by 1
    ) x;

  select coalesce(round(sum(total), 2), 0)
    into v_cash_sales
    from comandas
   where store_id = s.store_id and status = 'closed'
     and closed_at >= s.opened_at and closed_at <= v_until
     and payment_method = 'dinheiro';
  -- descontos e taxa de serviço do período inteiro (todas as formas)
  select coalesce(round(sum(discount), 2), 0), coalesce(round(sum(service_fee), 2), 0)
    into v_discounts, v_service_fee
    from comandas
   where store_id = s.store_id and status = 'closed'
     and closed_at >= s.opened_at and closed_at <= v_until;

  select coalesce(sum(amount) filter (where type = 'sangria'), 0),
         coalesce(sum(amount) filter (where type = 'suprimento'), 0)
    into v_sangrias, v_suprimentos
    from cash_movements where session_id = s.id;

  return jsonb_build_object(
    'session_id', s.id,
    'status', s.status,
    'opened_at', s.opened_at,
    'until', v_until,
    'opening_amount', s.opening_amount,
    'by_method', v_by_method,
    'sales_total', round(v_sales_total, 2),
    'sales_count', v_sales_count,
    'cash_sales', v_cash_sales,
    'discounts', v_discounts,
    'service_fee', v_service_fee,
    'sangrias', round(v_sangrias, 2),
    'suprimentos', round(v_suprimentos, 2),
    'expected_cash', round(s.opening_amount + v_cash_sales + v_suprimentos - v_sangrias, 2)
  );
end;
$$;

-- ── Abrir caixa ──
create or replace function public.cash_open(p_store_id uuid, p_opening_amount numeric, p_notes text default null)
returns public.cash_sessions
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  r cash_sessions;
begin
  if not public._can_operate_store(p_store_id) then raise exception 'Sem permissão para abrir o caixa desta loja'; end if;
  if coalesce(p_opening_amount, 0) < 0 then raise exception 'O troco inicial não pode ser negativo'; end if;
  if exists (select 1 from cash_sessions where store_id = p_store_id and status = 'open') then
    raise exception 'Já existe um caixa aberto nesta loja';
  end if;
  insert into cash_sessions (store_id, opened_by, opening_amount, opening_notes)
  values (p_store_id, auth.uid(), round(coalesce(p_opening_amount, 0), 2), nullif(trim(coalesce(p_notes, '')), ''))
  returning * into r;
  return r;
end;
$$;

-- ── Sangria / suprimento ──
create or replace function public.cash_add_movement(p_session_id uuid, p_type text, p_amount numeric, p_reason text default null)
returns public.cash_movements
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  s record;
  r cash_movements;
begin
  select * into s from cash_sessions where id = p_session_id for update;
  if not found then raise exception 'Caixa não encontrado'; end if;
  if not public._can_operate_store(s.store_id) then raise exception 'Sem permissão para este caixa'; end if;
  if s.status <> 'open' then raise exception 'Este caixa já foi fechado'; end if;
  if p_type not in ('sangria', 'suprimento') then raise exception 'Tipo inválido'; end if;
  if coalesce(p_amount, 0) <= 0 then raise exception 'Informe um valor maior que zero'; end if;
  insert into cash_movements (session_id, store_id, type, amount, reason, created_by)
  values (s.id, s.store_id, p_type, round(p_amount, 2), nullif(trim(coalesce(p_reason, '')), ''), auth.uid())
  returning * into r;
  return r;
end;
$$;

-- ── Fechar caixa (guarda o resumo do momento do fechamento) ──
create or replace function public.cash_close(p_session_id uuid, p_counted_amount numeric, p_notes text default null)
returns public.cash_sessions
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  s record;
  v_summary jsonb;
  r cash_sessions;
  v_now timestamptz := now();
begin
  select * into s from cash_sessions where id = p_session_id for update;
  if not found then raise exception 'Caixa não encontrado'; end if;
  if not public._can_operate_store(s.store_id) then raise exception 'Sem permissão para este caixa'; end if;
  if s.status <> 'open' then raise exception 'Este caixa já foi fechado'; end if;
  if p_counted_amount is null or p_counted_amount < 0 then raise exception 'Informe quanto foi contado na gaveta'; end if;

  update cash_sessions set closed_at = v_now where id = s.id;
  v_summary := public.cash_session_summary(s.id);

  update cash_sessions
     set status = 'closed',
         closed_by = auth.uid(),
         counted_amount = round(p_counted_amount, 2),
         expected_cash = (v_summary->>'expected_cash')::numeric,
         difference = round(p_counted_amount - (v_summary->>'expected_cash')::numeric, 2),
         summary = v_summary,
         closing_notes = nullif(trim(coalesce(p_notes, '')), '')
   where id = s.id
   returning * into r;
  return r;
end;
$$;

revoke all on function public.cash_session_summary(uuid) from public, anon;
revoke all on function public.cash_open(uuid, numeric, text) from public, anon;
revoke all on function public.cash_add_movement(uuid, text, numeric, text) from public, anon;
revoke all on function public.cash_close(uuid, numeric, text) from public, anon;
grant execute on function public.cash_session_summary(uuid) to authenticated;
grant execute on function public.cash_open(uuid, numeric, text) to authenticated;
grant execute on function public.cash_add_movement(uuid, text, numeric, text) to authenticated;
grant execute on function public.cash_close(uuid, numeric, text) to authenticated;

-- ── Opcional: exigir caixa aberto para fechar venda/comanda ──
create or replace function public._comanda_requires_open_cash()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'closed' and old.status is distinct from 'closed'
     and exists (select 1 from stores where id = new.store_id and pdv_require_open_cash)
     and not exists (select 1 from cash_sessions where store_id = new.store_id and status = 'open') then
    raise exception 'Abra o caixa antes de fechar vendas';
  end if;
  return new;
end;
$$;
revoke all on function public._comanda_requires_open_cash() from public, anon, authenticated;

create or replace trigger trg_comanda_requires_open_cash
  before update of status on public.comandas
  for each row
  when (new.status = 'closed' and old.status is distinct from 'closed')
  execute function public._comanda_requires_open_cash();
