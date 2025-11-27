-- Create custom_menus table for store admins to add iframe menus
create table if not exists public.custom_menus (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade not null,
  title text not null,
  iframe_url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Enable RLS
alter table public.custom_menus enable row level security;

-- Store admins can view their own store's custom menus
create policy "Store admins can view their custom menus"
  on public.custom_menus
  for select
  using (
    exists (
      select 1 from public.stores
      where stores.id = custom_menus.store_id
      and stores.owner_id = auth.uid()
    )
  );

-- Store admins can insert custom menus for their store
create policy "Store admins can insert custom menus"
  on public.custom_menus
  for insert
  with check (
    exists (
      select 1 from public.stores
      where stores.id = custom_menus.store_id
      and stores.owner_id = auth.uid()
    )
  );

-- Store admins can update their custom menus
create policy "Store admins can update their custom menus"
  on public.custom_menus
  for update
  using (
    exists (
      select 1 from public.stores
      where stores.id = custom_menus.store_id
      and stores.owner_id = auth.uid()
    )
  );

-- Store admins can delete their custom menus
create policy "Store admins can delete their custom menus"
  on public.custom_menus
  for delete
  using (
    exists (
      select 1 from public.stores
      where stores.id = custom_menus.store_id
      and stores.owner_id = auth.uid()
    )
  );

-- Create index for faster queries
create index if not exists custom_menus_store_id_idx on public.custom_menus(store_id);
create index if not exists custom_menus_is_active_idx on public.custom_menus(is_active);

-- Trigger to update updated_at
create or replace function public.update_custom_menus_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_custom_menus_updated_at
  before update on public.custom_menus
  for each row
  execute function public.update_custom_menus_updated_at();