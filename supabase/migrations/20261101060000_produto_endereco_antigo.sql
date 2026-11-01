-- Endereço de produto: quando o slug muda (nome editado ou correção de acentos), o endereço antigo
-- continua funcionando e manda para o novo (301 no servidor; a loja também redireciona).

create table if not exists public.product_slug_redirects (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  old_slug text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (store_id, old_slug)
);
alter table public.product_slug_redirects enable row level security;
drop policy if exists "Endereco antigo de produto visivel em loja ativa" on public.product_slug_redirects;
create policy "Endereco antigo de produto visivel em loja ativa" on public.product_slug_redirects
  for select to anon, authenticated using (public.is_active_store(store_id));

create or replace function public._product_slug_changed()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if old.slug is not null and old.slug <> '' and new.slug is distinct from old.slug then
    insert into product_slug_redirects (store_id, old_slug, product_id)
    values (new.store_id, old.slug, new.id)
    on conflict (store_id, old_slug) do update set product_id = excluded.product_id, created_at = now();
  end if;
  -- o endereço novo deixa de ser "antigo" de alguém
  if new.slug is not null then
    delete from product_slug_redirects where store_id = new.store_id and old_slug = new.slug;
  end if;
  return null;
end;
$$;
revoke all on function public._product_slug_changed() from public, anon, authenticated;

create or replace trigger trg_product_slug_changed
  after update of slug, name on public.products
  for each row execute function public._product_slug_changed();

-- Corrige os endereços antigos que perderam letras acentuadas ("Água" -> "gua"): slug vazio faz o
-- gatilho auto_generate_product_slug gerar de novo, já sem acento; o gatilho acima guarda o antigo.
update public.products p
   set slug = ''
 where p.slug !~ ('^' || trim(regexp_replace(regexp_replace(lower(trim(regexp_replace(
         translate(coalesce(p.name, ''), 'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
                   'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN'),
         '[^a-zA-Z0-9\s]', '', 'g'))), '\s+', '-', 'g'), '-+', '-', 'g'), '-') || '(-[0-9]+)?$');
