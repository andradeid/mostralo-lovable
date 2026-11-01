-- Comanda: adicionar item baixa o estoque (decrement_product_stock no navegador), mas remover o item
-- ou cancelar a comanda não devolvia. Agora o banco devolve nos dois casos (só comanda aberta).
-- A comanda não guarda variação; quem chama não passa variante, então a baixa e a devolução são no produto.

create or replace function public._restock_product(p_product_id uuid, p_qty integer)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update products
     set stock_quantity = stock_quantity + p_qty,
         is_available = case when stock_quantity <= 0 and p_qty > 0 then true else is_available end,
         updated_at = now()
   where id = p_product_id and coalesce(track_stock, false) and stock_quantity is not null and p_qty > 0;
$$;
revoke all on function public._restock_product(uuid, integer) from public, anon, authenticated;

create or replace function public._comanda_item_removed_restock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.product_id is not null
     and exists (select 1 from comandas c where c.id = old.comanda_id and c.status = 'open') then
    perform public._restock_product(old.product_id, coalesce(old.quantity, 0));
  end if;
  return old;
end;
$$;
revoke all on function public._comanda_item_removed_restock() from public, anon, authenticated;

create or replace trigger trg_comanda_item_removed_restock
  after delete on public.comanda_items
  for each row execute function public._comanda_item_removed_restock();

create or replace function public._comanda_cancel_restock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare r record;
begin
  if new.status = 'cancelled' and old.status = 'open' then
    for r in select product_id, sum(quantity)::int as qty from comanda_items
              where comanda_id = new.id and product_id is not null group by product_id loop
      perform public._restock_product(r.product_id, r.qty);
    end loop;
  end if;
  return new;
end;
$$;
revoke all on function public._comanda_cancel_restock() from public, anon, authenticated;

create or replace trigger trg_comanda_cancel_restock
  after update of status on public.comandas
  for each row execute function public._comanda_cancel_restock();
