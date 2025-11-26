-- Adicionar políticas RLS para store_admins e master_admins verem roles

-- Política para store_admin ver roles dos usuários da sua loja
create policy "store_admins_can_view_store_roles"
on public.user_roles
for select
to authenticated
using (
  store_id in (
    select id 
    from stores 
    where owner_id = auth.uid()
  )
);

-- Política para master_admin ver todas as roles
create policy "master_admins_can_view_all_roles"
on public.user_roles
for select
to authenticated
using (
  public.has_role(auth.uid(), 'master_admin')
);