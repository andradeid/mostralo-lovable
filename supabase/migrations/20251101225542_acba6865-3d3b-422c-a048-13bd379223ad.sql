-- Adicionar política RLS para donos de loja verem perfis dos seus entregadores
create policy "store_owners_can_view_driver_profiles"
on public.profiles
for select
to authenticated
using (
  public.is_store_owner_of_driver(id)
);