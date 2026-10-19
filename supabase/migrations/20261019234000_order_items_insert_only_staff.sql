-- Itens de pedido só podem ser criados pela equipe da loja (ou pelo servidor, que usa service role).
-- Antes qualquer visitante podia inserir itens em qualquer pedido.
alter policy "Público pode criar itens de pedido" on public.order_items
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (public.is_store_owner(o.store_id) or public.is_attendant_for_order_store(o.store_id) or public.is_master_admin())
    )
  );
alter policy "Público pode criar itens de pedido" on public.order_items rename to "Equipe da loja cria itens de pedido";
