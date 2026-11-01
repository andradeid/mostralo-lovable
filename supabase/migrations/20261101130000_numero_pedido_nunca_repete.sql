-- Número do pedido nunca repete: o contador da loja acompanha o maior número já gravado.
-- Antes, um pedido gravado por outro caminho (com número próprio) deixava o contador para trás
-- e o próximo pedido do site falhava com "número já existe" (aconteceu na Stark em 01/11).
create or replace function public.get_next_order_number(store_uuid uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  next_number integer;
begin
  update stores
     set last_order_number = greatest(
           coalesce(last_order_number, 0),
           coalesce((select max(o.order_number::bigint)::integer
                       from orders o
                      where o.store_id = store_uuid
                        and o.order_number ~ '^\d{1,9}$'), 0)
         ) + 1
   where id = store_uuid
   returning last_order_number into next_number;

  return lpad(next_number::text, 4, '0');
end;
$function$;

-- Acerta lojas com o contador atrás do maior número gravado
update stores s
   set last_order_number = m.maxn
  from (select store_id, max(order_number::bigint)::integer maxn
          from orders where order_number ~ '^\d{1,9}$' group by store_id) m
 where m.store_id = s.id and m.maxn > coalesce(s.last_order_number, 0);
