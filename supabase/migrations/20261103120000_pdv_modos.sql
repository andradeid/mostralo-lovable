-- PDV: três modos de tela (grade, lista/supermercado, misto/padaria), produto vendido por quilo
-- e atalhos do PDV (03/11/2026). Só acrescenta colunas, índice e uma função; nada é apagado.
--
-- - stores.pdv_layout: modo padrão da loja (cada computador pode trocar só para si, no navegador).
-- - products.sold_by_weight: o preço do produto é o preço do quilo; no PDV o item entra como 1 unidade
--   com o valor do peso (quantidade dos itens continua inteira em comanda_items/order_items).
-- - products.pdv_shortcut / pdv_shortcut_order: botão grande no modo Misto.
-- products tem leitura pública dos disponíveis; esses campos não são sensíveis.

alter table public.stores
  add column if not exists pdv_layout text not null default 'grid';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stores_pdv_layout_check') then
    alter table public.stores
      add constraint stores_pdv_layout_check check (pdv_layout in ('grid', 'list', 'mixed'));
  end if;
end $$;

comment on column public.stores.pdv_layout is
  'PDV: modo padrão da tela (grid = grade, list = lista/supermercado, mixed = misto/padaria). Cada computador pode trocar só para si.';

alter table public.products
  add column if not exists sold_by_weight boolean not null default false,
  add column if not exists pdv_shortcut boolean not null default false,
  add column if not exists pdv_shortcut_order integer;

comment on column public.products.sold_by_weight is
  'Vendido por quilo: price = preço do kg. No PDV entra como 1 unidade com unit_price = peso × preço (2 casas) e o peso no nome do item. Estoque não é controlado para esses produtos.';
comment on column public.products.pdv_shortcut is
  'Aparece como atalho (botão grande) no modo Misto do PDV.';
comment on column public.products.pdv_shortcut_order is
  'Ordem do atalho no PDV (vazio = depois dos ordenados, por nome).';

create index if not exists products_pdv_shortcut_idx
  on public.products (store_id, pdv_shortcut_order)
  where pdv_shortcut;

-- Modo padrão da loja: dono, administrador da loja (user_roles store_admin) ou master.
-- A política de update de stores só cobre dono e master; esta função cobre também o administrador,
-- mudando só esta coluna.
create or replace function public.set_store_pdv_layout(p_store_id uuid, p_layout text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or not public.is_store_admin_of(p_store_id) then
    raise exception 'Só o dono ou administrador da loja pode mudar o modo do PDV';
  end if;
  if p_layout is null or p_layout not in ('grid', 'list', 'mixed') then
    raise exception 'Modo do PDV inválido';
  end if;
  update public.stores set pdv_layout = p_layout, updated_at = now() where id = p_store_id;
  if not found then
    raise exception 'Loja não encontrada';
  end if;
  return p_layout;
end;
$$;

revoke all on function public.set_store_pdv_layout(uuid, text) from public, anon;
grant execute on function public.set_store_pdv_layout(uuid, text) to authenticated;
