-- Baixa de estoque para pedidos (loja online, painel e iFood), igual ao PDV/comandas.
-- Antes só useComandas chamava decrement_product_stock; agora todo item gravado em order_items
-- baixa o estoque do produto que controla estoque, e o cancelamento do pedido devolve.
-- O PDV/comandas não grava order_items, então não há baixa em dobro.
-- (Variações: order_items não guarda a variação; a baixa é no produto.)

create or replace function public._order_items_decrement_stock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_track boolean;
  v_stock integer;
begin
  if new.product_id is null or coalesce(new.quantity, 0) <= 0 then
    return new;
  end if;
  select track_stock, stock_quantity into v_track, v_stock
    from products where id = new.product_id for update;
  if not coalesce(v_track, false) or v_stock is null then
    return new;
  end if;
  update products
     set stock_quantity = greatest(0, v_stock - new.quantity),
         is_available = case when v_stock - new.quantity <= 0 then false else is_available end,
         updated_at = now()
   where id = new.product_id;
  return new;
end;
$$;

drop trigger if exists trg_order_items_decrement_stock on public.order_items;
create trigger trg_order_items_decrement_stock
  after insert on public.order_items
  for each row execute function public._order_items_decrement_stock();

create or replace function public._order_cancel_restock()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'cancelado' and old.status is distinct from 'cancelado' then
    -- Produto que esgotou (estoque 0) volta a ficar disponível com a devolução
    update products p
       set stock_quantity = p.stock_quantity + oi.qty,
           is_available = case when p.stock_quantity <= 0 and oi.qty > 0 then true else p.is_available end,
           updated_at = now()
      from (select product_id, sum(quantity)::int as qty
              from order_items where order_id = new.id and product_id is not null
             group by product_id) oi
     where p.id = oi.product_id and coalesce(p.track_stock, false) and p.stock_quantity is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_cancel_restock on public.orders;
create trigger trg_order_cancel_restock
  after update of status on public.orders
  for each row execute function public._order_cancel_restock();

revoke all on function public._order_items_decrement_stock() from public, anon, authenticated;
revoke all on function public._order_cancel_restock() from public, anon, authenticated;
