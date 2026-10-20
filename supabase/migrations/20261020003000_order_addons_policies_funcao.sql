-- order_addons: políticas via função (consulta de 1,5 s para < 1 ms) e inserção só pela equipe da loja.
create or replace function public._order_addon_access(p_order_item_id uuid, p_kind text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select public._order_item_access(oi.order_id, p_kind) from order_items oi where oi.id = p_order_item_id), false)
$$;
create or replace function public._order_addon_staff_insert(p_order_item_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists(select 1 from order_items oi join orders o on o.id = oi.order_id
    where oi.id = p_order_item_id and (is_store_owner(o.store_id) or is_attendant_for_order_store(o.store_id) or is_master_admin()))
$$;
revoke all on function public._order_addon_access(uuid,text) from public, anon;
revoke all on function public._order_addon_staff_insert(uuid) from public, anon;
grant execute on function public._order_addon_access(uuid,text) to authenticated;
grant execute on function public._order_addon_staff_insert(uuid) to authenticated;
alter policy "Attendants can view their store order_addons" on public.order_addons using (public._order_addon_access(order_item_id, 'attendant'));
alter policy "Customers can view their own order addons" on public.order_addons using (public._order_addon_access(order_item_id, 'customer'));
alter policy "Donos das lojas podem ver adicionais dos seus pedidos" on public.order_addons using (public._order_addon_access(order_item_id, 'owner'));
alter policy "Entregadores podem ver adicionais dos seus pedidos" on public.order_addons using (public._order_addon_access(order_item_id, 'driver'));
alter policy "Master admins podem ver todos os adicionais" on public.order_addons using (is_master_admin());
alter policy "Público pode criar adicionais de itens" on public.order_addons to authenticated with check (public._order_addon_staff_insert(order_item_id));
alter policy "Público pode criar adicionais de itens" on public.order_addons rename to "Equipe da loja cria adicionais de pedido";
