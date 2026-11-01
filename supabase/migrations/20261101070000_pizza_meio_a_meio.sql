-- Pizza com mais de um sabor (meio a meio), ligada por categoria.
alter table public.categories
  add column if not exists multi_flavor_enabled boolean not null default false,
  add column if not exists multi_flavor_pricing text not null default 'average',
  add column if not exists multi_flavor_max jsonb not null default '{}'::jsonb;

do $$ begin
  alter table public.categories add constraint categories_multi_flavor_pricing_chk
    check (multi_flavor_pricing in ('average', 'highest'));
exception when duplicate_object then null; end $$;

-- Sabores da pizza no item do pedido: [{product_id, name, fraction}]
alter table public.order_items add column if not exists flavors jsonb;
