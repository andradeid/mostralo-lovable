-- Frete por CEP (Melhor Envio) — 21/11/2026
-- Aditivo: configuração de envio por loja, token guardado fora do alcance do navegador,
-- peso e medidas do produto e o envio escolhido no pedido.

-- ── Configuração de envio da loja (pública: a vitrine precisa saber se o envio está ligado) ──
create table if not exists public.store_shipping_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  enabled boolean not null default false,
  environment text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  origin_postal_code text check (origin_postal_code is null or origin_postal_code ~ '^[0-9]{8}$'),
  services text[] not null default array['1', '2', '3'],          -- ids de serviço do Melhor Envio (1 PAC, 2 SEDEX, 3 Jadlog .Package)
  default_weight_kg numeric(8,3) not null default 0.8 check (default_weight_kg > 0 and default_weight_kg <= 100),
  default_height_cm numeric(6,1) not null default 12 check (default_height_cm > 0 and default_height_cm <= 200),
  default_width_cm numeric(6,1) not null default 22 check (default_width_cm > 0 and default_width_cm <= 200),
  default_length_cm numeric(6,1) not null default 33 check (default_length_cm > 0 and default_length_cm <= 200),
  handling_days integer not null default 1 check (handling_days between 0 and 60),
  free_shipping_min numeric(10,2) check (free_shipping_min is null or free_shipping_min > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.store_shipping_settings enable row level security;

drop policy if exists "store_shipping_settings_public_read" on public.store_shipping_settings;
create policy "store_shipping_settings_public_read" on public.store_shipping_settings
  for select using (true);

drop policy if exists "store_shipping_settings_admin_insert" on public.store_shipping_settings;
create policy "store_shipping_settings_admin_insert" on public.store_shipping_settings
  for insert to authenticated with check (public.is_store_admin_of(store_id));

drop policy if exists "store_shipping_settings_admin_update" on public.store_shipping_settings;
create policy "store_shipping_settings_admin_update" on public.store_shipping_settings
  for update to authenticated using (public.is_store_admin_of(store_id)) with check (public.is_store_admin_of(store_id));

create or replace function public._touch_store_shipping_settings()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_store_shipping_settings on public.store_shipping_settings;
create trigger trg_touch_store_shipping_settings before update on public.store_shipping_settings
  for each row execute function public._touch_store_shipping_settings();

-- ── Token do Melhor Envio: só o servidor lê (sem políticas = ninguém pelo navegador) ──
create table if not exists public.store_shipping_secrets (
  store_id uuid primary key references public.stores(id) on delete cascade,
  melhor_envio_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.store_shipping_secrets enable row level security;
revoke all on public.store_shipping_secrets from anon, authenticated;

-- Gravar/apagar o token (admin da loja). Token vazio apaga.
create or replace function public.set_shipping_token(p_store_id uuid, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_token text := nullif(btrim(coalesce(p_token, '')), '');
begin
  if not public.is_store_admin_of(p_store_id) then
    raise exception 'Sem permissão para configurar o envio desta loja.' using errcode = '42501';
  end if;
  if v_token is null then
    delete from public.store_shipping_secrets where store_id = p_store_id;
    return jsonb_build_object('has_token', false);
  end if;
  if length(v_token) < 20 or length(v_token) > 4000 then
    raise exception 'Token inválido.' using errcode = '22023';
  end if;
  insert into public.store_shipping_secrets (store_id, melhor_envio_token, updated_at)
  values (p_store_id, v_token, now())
  on conflict (store_id) do update set melhor_envio_token = excluded.melhor_envio_token, updated_at = now();
  return jsonb_build_object('has_token', true, 'updated_at', now());
end $$;

-- Saber se há token, sem expor o token
create or replace function public.shipping_token_status(p_store_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record;
begin
  if not public.is_store_admin_of(p_store_id) then
    raise exception 'Sem permissão.' using errcode = '42501';
  end if;
  select updated_at into r from public.store_shipping_secrets where store_id = p_store_id;
  return jsonb_build_object('has_token', found, 'updated_at', r.updated_at);
end $$;

revoke all on function public.set_shipping_token(uuid, text) from public, anon;
revoke all on function public.shipping_token_status(uuid) from public, anon;
grant execute on function public.set_shipping_token(uuid, text) to authenticated;
grant execute on function public.shipping_token_status(uuid) to authenticated;

-- ── Peso e medidas do produto para envio (vazio = embalagem padrão da loja) ──
alter table public.products add column if not exists shipping_weight_kg numeric(8,3);
alter table public.products add column if not exists shipping_height_cm numeric(6,1);
alter table public.products add column if not exists shipping_width_cm numeric(6,1);
alter table public.products add column if not exists shipping_length_cm numeric(6,1);
do $$ begin
  alter table public.products add constraint products_shipping_dims_positive check (
    (shipping_weight_kg is null or (shipping_weight_kg > 0 and shipping_weight_kg <= 100)) and
    (shipping_height_cm is null or (shipping_height_cm > 0 and shipping_height_cm <= 200)) and
    (shipping_width_cm is null or (shipping_width_cm > 0 and shipping_width_cm <= 200)) and
    (shipping_length_cm is null or (shipping_length_cm > 0 and shipping_length_cm <= 200))
  );
exception when duplicate_object then null; end $$;

-- ── Envio escolhido no pedido (delivery_type continua 'delivery'; shipping preenchido = envio por transportadora) ──
alter table public.orders add column if not exists shipping jsonb;
alter table public.orders add column if not exists tracking_code text;
