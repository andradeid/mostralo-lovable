-- Painel mais rápido (02/11/2026): tudo que o painel precisa para saber quais módulos a loja tem
-- numa chamada só (antes eram 4 consultas em sequência, repetidas por vários componentes).
-- SECURITY INVOKER: cada leitura respeita as mesmas regras (RLS) de antes.
create or replace function public.store_module_access(p_store_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path to 'public'
as $$
  select jsonb_build_object(
    'plan_id', (select s.plan_id from stores s where s.id = p_store_id),
    'modules', coalesce((select jsonb_agg(to_jsonb(m) order by m.name) from modules m where m.is_active = true), '[]'::jsonb),
    'plan_module_ids', coalesce((
      select jsonb_agg(pm.module_id)
        from plan_modules pm
       where pm.plan_id = (select s.plan_id from stores s where s.id = p_store_id)), '[]'::jsonb),
    'store_modules', coalesce((select jsonb_agg(to_jsonb(sm)) from store_modules sm where sm.store_id = p_store_id), '[]'::jsonb)
  );
$$;
revoke all on function public.store_module_access(uuid) from public, anon;
grant execute on function public.store_module_access(uuid) to authenticated;
