-- Frente de caixa (02/11/2026): código de barras no produto e entrada de mercadoria com custo.
-- O custo NÃO fica em products (a tabela tem leitura pública da vitrine): fica em product_costs,
-- só para a equipe da loja.

alter table public.products add column if not exists barcode text;
comment on column public.products.barcode is 'Código de barras (EAN/GTIN ou interno), único por loja.';
create unique index if not exists products_store_barcode_key
  on public.products (store_id, barcode) where barcode is not null and barcode <> '';

create table if not exists public.product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  cost_price numeric(12,4) not null default 0 check (cost_price >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
create index if not exists product_costs_store_idx on public.product_costs (store_id);

create table if not exists public.stock_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,4) not null default 0 check (unit_cost >= 0),
  supplier text,
  invoice_number text,
  notes text,
  stock_before integer,
  stock_after integer,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists stock_entries_store_created_idx on public.stock_entries (store_id, created_at desc);
create index if not exists stock_entries_product_idx on public.stock_entries (product_id, created_at desc);

alter table public.product_costs enable row level security;
alter table public.stock_entries enable row level security;

create policy "Store team can read product costs" on public.product_costs
  for select to authenticated using (public._can_operate_store(store_id));
create policy "Store admins can write product costs" on public.product_costs
  for insert to authenticated with check (public.is_store_admin_of(store_id));
create policy "Store admins can update product costs" on public.product_costs
  for update to authenticated using (public.is_store_admin_of(store_id)) with check (public.is_store_admin_of(store_id));
create policy "Store team can read stock entries" on public.stock_entries
  for select to authenticated using (public._can_operate_store(store_id));

revoke all on public.product_costs, public.stock_entries from anon;
revoke insert, update, delete on public.stock_entries from authenticated;
revoke delete on public.product_costs from authenticated;

-- Custo pertence à loja do produto
create or replace function public._product_costs_store_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  select store_id into new.store_id from products where id = new.product_id;
  if new.store_id is null then raise exception 'Produto não encontrado'; end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end; $$;
revoke all on function public._product_costs_store_guard() from public, anon, authenticated;
create or replace trigger trg_product_costs_store_guard
  before insert or update on public.product_costs
  for each row execute function public._product_costs_store_guard();

-- Entrada de mercadoria: soma no estoque, reativa o produto se estava zerado e atualiza o custo
-- (custo médio ponderado quando há estoque controlado; senão, o custo da entrada).
create or replace function public.stock_add_entry(
  p_product_id uuid, p_quantity integer, p_unit_cost numeric default null,
  p_supplier text default null, p_invoice_number text default null, p_notes text default null)
returns public.stock_entries
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  p record;
  v_old_cost numeric;
  v_new_cost numeric;
  v_before integer;
  v_after integer;
  r stock_entries;
begin
  select id, store_id, track_stock, stock_quantity, is_available into p
    from products where id = p_product_id for update;
  if not found then raise exception 'Produto não encontrado'; end if;
  if not public._can_operate_store(p.store_id) then raise exception 'Sem permissão para esta loja'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Informe uma quantidade maior que zero'; end if;
  if p_unit_cost is not null and p_unit_cost < 0 then raise exception 'O custo não pode ser negativo'; end if;

  v_before := coalesce(p.stock_quantity, 0);
  v_after := v_before + p_quantity;

  update products
     set track_stock = true,
         stock_quantity = v_after,
         is_available = case when v_before <= 0 then true else is_available end,
         updated_at = now()
   where id = p.id;

  if p_unit_cost is not null then
    select cost_price into v_old_cost from product_costs where product_id = p.id;
    v_new_cost := case
      when v_old_cost is not null and v_before > 0
        then round(((v_old_cost * v_before) + (p_unit_cost * p_quantity)) / v_after, 4)
      else round(p_unit_cost, 4)
    end;
    insert into product_costs (product_id, store_id, cost_price)
    values (p.id, p.store_id, v_new_cost)
    on conflict (product_id) do update set cost_price = excluded.cost_price;
  end if;

  insert into stock_entries (store_id, product_id, quantity, unit_cost, supplier, invoice_number, notes,
                             stock_before, stock_after, created_by)
  values (p.store_id, p.id, p_quantity, coalesce(round(p_unit_cost, 4), 0),
          nullif(trim(coalesce(p_supplier, '')), ''), nullif(trim(coalesce(p_invoice_number, '')), ''),
          nullif(trim(coalesce(p_notes, '')), ''), v_before, v_after, auth.uid())
  returning * into r;
  return r;
end;
$$;
revoke all on function public.stock_add_entry(uuid, integer, numeric, text, text, text) from public, anon;
grant execute on function public.stock_add_entry(uuid, integer, numeric, text, text, text) to authenticated;
