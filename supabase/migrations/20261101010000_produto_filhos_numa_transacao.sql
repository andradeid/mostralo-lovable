-- Variações e adicionais do produto gravados numa única operação (tudo ou nada).
-- Antes o painel apagava e recriava pelo navegador, em passos separados: se um falhasse no meio,
-- o produto ficava sem variações ou sem adicionais. Agora:
--  - variação que já existe é atualizada (mantém o id e o controle de estoque dela);
--  - variação nova é inserida; a que saiu da tela é apagada;
--  - adicionais: mantém os que continuam nas categorias escolhidas, insere os novos e tira os demais.
-- Roda com a permissão de quem chama (security invoker): valem as mesmas regras de acesso de antes.
create or replace function public.save_product_children(
  p_product_id uuid,
  p_variants jsonb,
  p_addon_category_ids uuid[]
) returns void
language plpgsql
security invoker
set search_path to 'public'
as $$
declare
  v jsonb;
  i int := 0;
  v_id uuid;
  keep uuid[] := '{}';
  cats uuid[] := coalesce(p_addon_category_ids, '{}');
begin
  if p_product_id is null then
    raise exception 'Produto não informado' using errcode = '22023';
  end if;

  for v in select * from jsonb_array_elements(coalesce(p_variants, '[]'::jsonb)) loop
    v_id := nullif(v->>'id', '')::uuid;
    if v_id is not null and exists (select 1 from product_variants where id = v_id and product_id = p_product_id) then
      update product_variants
         set name = v->>'name',
             price = (v->>'price')::numeric,
             is_default = coalesce((v->>'is_default')::boolean, false),
             display_order = i,
             is_available = true
       where id = v_id;
    else
      insert into product_variants (product_id, name, price, is_default, display_order, is_available)
      values (p_product_id, v->>'name', (v->>'price')::numeric, coalesce((v->>'is_default')::boolean, false), i, true)
      returning id into v_id;
    end if;
    keep := keep || v_id;
    i := i + 1;
  end loop;

  delete from product_variants where product_id = p_product_id and not (id = any(keep));

  delete from product_addons pa
   where pa.product_id = p_product_id
     and not exists (select 1 from addons a where a.id = pa.addon_id and a.category_id = any(cats));

  insert into product_addons (product_id, addon_id, is_required, max_quantity)
  select p_product_id, a.id, false, 1
    from addons a
   where a.category_id = any(cats)
     and not exists (select 1 from product_addons pa where pa.product_id = p_product_id and pa.addon_id = a.id);
end;
$$;

revoke all on function public.save_product_children(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.save_product_children(uuid, jsonb, uuid[]) to authenticated;
