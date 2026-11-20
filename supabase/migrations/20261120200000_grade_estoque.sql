-- Grade de estoque (cor × tamanho) por variação — 20/11/2026
-- products.grade: definição da grade ({"attributes":[{"name":"Cor","values":[{"value":"Preto","hex":"#1f1d1a"}]},{"name":"Tamanho","values":[{"value":"37"}]}]}).
-- product_variants.attributes: a combinação ({"Cor":"Preto","Tamanho":"37"}); barcode por combinação.
-- order_items / comanda_items / stock_entries ganham variant_id: a baixa e a devolução passam a ser por combinação.
-- Produto com grade: products.stock_quantity = soma das combinações (gatilho), e a combinação zerada continua
-- visível (is_available segue true) para a loja mostrar "esgotado". Sem variant_id tudo funciona como antes.

alter table public.products add column if not exists grade jsonb;
alter table public.product_variants add column if not exists attributes jsonb;
alter table public.product_variants add column if not exists barcode text;
alter table public.order_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.comanda_items add column if not exists variant_id uuid references public.product_variants(id) on delete set null;
alter table public.stock_entries add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create index if not exists product_variants_barcode_idx on public.product_variants (barcode) where barcode is not null;
create index if not exists order_items_variant_idx on public.order_items (variant_id) where variant_id is not null;

-- Código de barras único na loja (produtos + combinações)
create or replace function public._variant_barcode_check()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_store uuid;
begin
  new.barcode := nullif(trim(coalesce(new.barcode, '')), '');
  if new.barcode is null then return new; end if;
  select store_id into v_store from products where id = new.product_id;
  if exists (select 1 from products p where p.store_id = v_store and p.barcode = new.barcode)
     or exists (select 1 from product_variants v join products p on p.id = v.product_id
                 where p.store_id = v_store and v.barcode = new.barcode and v.id <> new.id) then
    raise exception 'Código de barras já usado em outro produto da loja (%)', new.barcode using errcode = '23505';
  end if;
  return new;
end $$;
drop trigger if exists trg_variant_barcode_check on public.product_variants;
create trigger trg_variant_barcode_check before insert or update of barcode on public.product_variants
  for each row execute function public._variant_barcode_check();

create or replace function public._product_barcode_vs_variants()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.barcode is not null and new.barcode <> '' and exists (
    select 1 from product_variants v join products p on p.id = v.product_id
     where p.store_id = new.store_id and v.barcode = new.barcode and v.product_id <> new.id) then
    raise exception 'Código de barras já usado em outro produto da loja (%)', new.barcode using errcode = '23505';
  end if;
  return new;
end $$;
drop trigger if exists trg_product_barcode_vs_variants on public.products;
create trigger trg_product_barcode_vs_variants before insert or update of barcode on public.products
  for each row execute function public._product_barcode_vs_variants();

-- Total do produto com grade = soma das combinações
create or replace function public._sync_grade_stock(p_product_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_total integer;
begin
  if not exists (select 1 from products where id = p_product_id and grade is not null) then return; end if;
  select coalesce(sum(greatest(stock_quantity, 0)), 0)::int into v_total
    from product_variants where product_id = p_product_id and coalesce(track_stock, false);
  update products
     set track_stock = true,
         stock_quantity = v_total,
         is_available = case when v_total <= 0 then false
                             when coalesce(stock_quantity, 0) <= 0 then true
                             else is_available end,
         updated_at = now()
   where id = p_product_id
     and (stock_quantity is distinct from v_total or track_stock is distinct from true
          or (v_total <= 0 and is_available) or (v_total > 0 and coalesce(stock_quantity, 0) <= 0));
end $$;

create or replace function public._variant_stock_changed()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform public._sync_grade_stock(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end $$;
drop trigger if exists trg_variant_stock_changed on public.product_variants;
create trigger trg_variant_stock_changed after insert or delete or update of stock_quantity, track_stock on public.product_variants
  for each row execute function public._variant_stock_changed();

-- Baixa por combinação (PDV/comandas); combinação da grade não some ao zerar
create or replace function public.decrement_product_stock(p_product_id uuid, p_variant_id uuid default null::uuid, p_quantity integer default 1)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_current_stock integer; v_track_stock boolean; v_new_stock integer; v_attrs jsonb; v_grade jsonb;
begin
  if auth.uid() is not null and not public._can_operate_store((select store_id from public.products where id = p_product_id)) then
    raise exception 'Acesso negado';
  end if;
  if p_variant_id is not null then
    select stock_quantity, track_stock, attributes into v_current_stock, v_track_stock, v_attrs
      from product_variants where id = p_variant_id and product_id = p_product_id for update;
    if v_track_stock is not true or v_current_stock is null then
      return jsonb_build_object('success', true, 'message', 'Estoque não controlado');
    end if;
    if v_current_stock < p_quantity then
      return jsonb_build_object('success', false, 'message', 'Estoque insuficiente', 'available', v_current_stock, 'requested', p_quantity);
    end if;
    v_new_stock := v_current_stock - p_quantity;
    update product_variants
       set stock_quantity = v_new_stock,
           is_available = case when v_new_stock <= 0 and v_attrs is null then false else is_available end,
           updated_at = now()
     where id = p_variant_id;
  else
    select stock_quantity, track_stock, grade into v_current_stock, v_track_stock, v_grade
      from products where id = p_product_id for update;
    if v_grade is not null then
      -- Produto com grade sem combinação escolhida: o estoque fica nas combinações
      return jsonb_build_object('success', true, 'message', 'Estoque por combinação');
    end if;
    if v_track_stock is not true or v_current_stock is null then
      return jsonb_build_object('success', true, 'message', 'Estoque não controlado');
    end if;
    if v_current_stock < p_quantity then
      return jsonb_build_object('success', false, 'message', 'Estoque insuficiente', 'available', v_current_stock, 'requested', p_quantity);
    end if;
    v_new_stock := v_current_stock - p_quantity;
    update products set stock_quantity = v_new_stock,
           is_available = case when v_new_stock <= 0 then false else is_available end,
           updated_at = now()
     where id = p_product_id;
  end if;
  return jsonb_build_object('success', true, 'previous_stock', v_current_stock, 'new_stock', v_new_stock,
                            'decremented', p_quantity, 'message', 'Estoque atualizado com sucesso');
end $$;

-- Pedido (loja, painel, iFood): baixa ao gravar o item
create or replace function public._order_items_decrement_stock()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_track boolean; v_stock integer; v_attrs jsonb; v_grade jsonb;
begin
  if new.product_id is null or coalesce(new.quantity, 0) <= 0 then return new; end if;
  if new.variant_id is not null then
    select track_stock, stock_quantity, attributes into v_track, v_stock, v_attrs
      from product_variants where id = new.variant_id and product_id = new.product_id for update;
    if found and coalesce(v_track, false) and v_stock is not null then
      update product_variants
         set stock_quantity = greatest(0, v_stock - new.quantity),
             is_available = case when v_stock - new.quantity <= 0 and v_attrs is null then false else is_available end,
             updated_at = now()
       where id = new.variant_id;
      return new;
    end if;
  end if;
  select track_stock, stock_quantity, grade into v_track, v_stock, v_grade
    from products where id = new.product_id for update;
  if v_grade is not null or not coalesce(v_track, false) or v_stock is null then return new; end if;
  update products
     set stock_quantity = greatest(0, v_stock - new.quantity),
         is_available = case when v_stock - new.quantity <= 0 then false else is_available end,
         updated_at = now()
   where id = new.product_id;
  return new;
end $$;

-- Devolução de um item (combinação controlada ou produto)
create or replace function public._restock_item(p_product_id uuid, p_variant_id uuid, p_qty integer)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if p_qty is null or p_qty <= 0 or p_product_id is null then return; end if;
  if p_variant_id is not null and exists (
       select 1 from product_variants where id = p_variant_id and coalesce(track_stock, false) and stock_quantity is not null) then
    update product_variants
       set stock_quantity = stock_quantity + p_qty,
           is_available = case when stock_quantity <= 0 then true else is_available end,
           updated_at = now()
     where id = p_variant_id;
    return;
  end if;
  if exists (select 1 from products where id = p_product_id and grade is not null) then return; end if;
  perform public._restock_product(p_product_id, p_qty);
end $$;

create or replace function public._order_cancel_restock()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare r record;
begin
  if new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    for r in select product_id, variant_id, sum(quantity)::int as qty from order_items
              where order_id = new.id and product_id is not null group by product_id, variant_id loop
      perform public._restock_item(r.product_id, r.variant_id, r.qty);
    end loop;
  end if;
  return new;
end $$;

create or replace function public._comanda_item_removed_restock()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if old.product_id is not null
     and exists (select 1 from comandas c where c.id = old.comanda_id and c.status = 'open') then
    perform public._restock_item(old.product_id, old.variant_id, coalesce(old.quantity, 0));
  end if;
  return old;
end $$;

create or replace function public._comanda_cancel_restock()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare r record;
begin
  if new.status = 'cancelled' and old.status = 'open' then
    for r in select product_id, variant_id, sum(quantity)::int as qty from comanda_items
              where comanda_id = new.id and product_id is not null group by product_id, variant_id loop
      perform public._restock_item(r.product_id, r.variant_id, r.qty);
    end loop;
  end if;
  return new;
end $$;

-- Gravação das variações: aceita atributos, código e estoque (campos ausentes ficam como estão)
create or replace function public.save_product_children(p_product_id uuid, p_variants jsonb, p_addon_category_ids uuid[])
returns void language plpgsql set search_path to 'public' as $$
declare
  v jsonb; i int := 0; v_id uuid; keep uuid[] := '{}'; cats uuid[] := coalesce(p_addon_category_ids, '{}');
begin
  if p_product_id is null then
    raise exception 'Produto não informado' using errcode = '22023';
  end if;

  for v in select * from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) loop
    v_id := nullif(v->>'id', '')::uuid;
    if v_id is not null and exists (select 1 from product_variants where id = v_id and product_id = p_product_id) then
      update product_variants
         set name = v->>'name',
             price = (v->>'price')::numeric,
             is_default = coalesce((v->>'is_default')::boolean, false),
             display_order = i,
             is_available = true,
             attributes = case when v ? 'attributes' then nullif(v->'attributes', 'null'::jsonb) else attributes end,
             barcode = case when v ? 'barcode' then nullif(trim(coalesce(v->>'barcode', '')), '') else barcode end,
             track_stock = case when v ? 'track_stock' then coalesce((v->>'track_stock')::boolean, false) else track_stock end,
             stock_quantity = case when v ? 'stock_quantity' then (v->>'stock_quantity')::int else stock_quantity end
       where id = v_id;
    else
      insert into product_variants (product_id, name, price, is_default, display_order, is_available,
                                    attributes, barcode, track_stock, stock_quantity)
      values (p_product_id, v->>'name', (v->>'price')::numeric, coalesce((v->>'is_default')::boolean, false), i, true,
              nullif(v->'attributes', 'null'::jsonb), nullif(trim(coalesce(v->>'barcode', '')), ''),
              coalesce((v->>'track_stock')::boolean, false), (v->>'stock_quantity')::int)
      returning id into v_id;
    end if;
    keep := keep || v_id;
    i := i + 1;
  end loop;

  delete from product_variants where product_id = p_product_id and not (id = any(keep));
  perform public._sync_grade_stock(p_product_id);

  delete from product_addons pa
   where pa.product_id = p_product_id
     and not exists (select 1 from addons a where a.id = pa.addon_id and a.category_id = any(cats));

  insert into product_addons (product_id, addon_id, is_required, max_quantity)
  select p_product_id, a.id, false, 1
    from addons a
   where a.category_id = any(cats)
     and not exists (select 1 from product_addons pa where pa.product_id = p_product_id and pa.addon_id = a.id);
end;
$$;

-- Entrada de mercadoria por combinação (custo continua por produto, média pelo total do produto)
drop function if exists public.stock_add_entry(uuid, integer, numeric, text, text, text);
create or replace function public.stock_add_entry(p_product_id uuid, p_quantity integer, p_unit_cost numeric default null::numeric,
  p_supplier text default null::text, p_invoice_number text default null::text, p_notes text default null::text,
  p_variant_id uuid default null::uuid)
returns stock_entries language plpgsql security definer set search_path to 'public' as $$
declare
  p record; vr record; v_old_cost numeric; v_new_cost numeric; v_before integer; v_after integer;
  v_prod_before integer; r stock_entries;
begin
  select id, store_id, track_stock, stock_quantity, is_available, grade into p from products where id = p_product_id for update;
  if not found then raise exception 'Produto não encontrado'; end if;
  if not public._can_operate_store(p.store_id) then raise exception 'Sem permissão para esta loja'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Informe uma quantidade maior que zero'; end if;
  if p_unit_cost is not null and p_unit_cost < 0 then raise exception 'O custo não pode ser negativo'; end if;
  if p.grade is not null and p_variant_id is null then raise exception 'Escolha a combinação (cor e tamanho) da entrada'; end if;
  v_prod_before := coalesce(p.stock_quantity, 0);

  if p_variant_id is not null then
    select id, stock_quantity into vr from product_variants where id = p_variant_id and product_id = p.id for update;
    if not found then raise exception 'Combinação não encontrada neste produto'; end if;
    v_before := coalesce(vr.stock_quantity, 0);
    v_after := v_before + p_quantity;
    update product_variants set track_stock = true, stock_quantity = v_after, is_available = true, updated_at = now()
     where id = vr.id;
  else
    v_before := v_prod_before;
    v_after := v_before + p_quantity;
    update products set track_stock = true, stock_quantity = v_after,
           is_available = case when v_before <= 0 then true else is_available end, updated_at = now()
     where id = p.id;
  end if;

  if p_unit_cost is not null then
    select cost_price into v_old_cost from product_costs where product_id = p.id;
    v_new_cost := case when v_old_cost is not null and v_prod_before > 0
        then round(((v_old_cost * v_prod_before) + (p_unit_cost * p_quantity)) / (v_prod_before + p_quantity), 4)
      else round(p_unit_cost, 4) end;
    insert into product_costs (product_id, store_id, cost_price) values (p.id, p.store_id, v_new_cost)
    on conflict (product_id) do update set cost_price = excluded.cost_price;
  end if;
  insert into stock_entries (store_id, product_id, variant_id, quantity, unit_cost, supplier, invoice_number, notes, stock_before, stock_after, created_by)
  values (p.store_id, p.id, p_variant_id, p_quantity, coalesce(round(p_unit_cost, 4), 0),
          nullif(trim(coalesce(p_supplier, '')), ''), nullif(trim(coalesce(p_invoice_number, '')), ''),
          nullif(trim(coalesce(p_notes, '')), ''), v_before, v_after, auth.uid())
  returning * into r;
  return r;
end $$;
grant execute on function public.stock_add_entry(uuid, integer, numeric, text, text, text, uuid) to authenticated;
