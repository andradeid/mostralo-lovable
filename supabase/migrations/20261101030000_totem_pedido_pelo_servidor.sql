-- Totem: pedido criado pelo servidor ANTES do Pix, com os itens gravados.
-- Fica em "aguardando_pagamento" (fora do Kanban) até a EFI confirmar o Pix; então vai para
-- "em_preparo" e ganha a senha da chamada. O navegador não marca mais nada como pago.

-- 1. Pagou: sai de aguardando_pagamento para em_preparo (vale para quem confirmar: webhook ou consulta)
create or replace function public._order_paid_leaves_waiting()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if NEW.payment_status = 'paid'
     and OLD.payment_status is distinct from 'paid'
     and NEW.status = 'aguardando_pagamento' then
    NEW.status := 'em_preparo';
  end if;
  return NEW;
end;
$$;

create or replace trigger trg_order_paid_leaves_waiting
  before update of payment_status on public.orders
  for each row execute function public._order_paid_leaves_waiting();

-- 2. Pedido do totem pago: cria a senha da chamada (uma vez só)
create or replace function public._totem_order_password_call()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if NEW.source = 'totem'
     and NEW.payment_status = 'paid'
     and OLD.payment_status is distinct from 'paid'
     and not exists (select 1 from password_calls pc where pc.order_id = NEW.id) then
    insert into password_calls (store_id, order_id, call_number, customer_name)
    values (NEW.store_id, NEW.id, NEW.order_number, coalesce(nullif(NEW.customer_name, ''), 'Totem'));
  end if;
  return null;
exception when others then
  raise warning 'Senha do pedido do totem %: %', NEW.id, sqlerrm;
  return null;
end;
$$;

create or replace trigger trg_totem_order_password_call
  after update of payment_status on public.orders
  for each row execute function public._totem_order_password_call();

-- 3. Pix do totem não pago a tempo: cancela (o gatilho de cancelamento devolve o estoque)
create or replace function public.cancel_stale_totem_orders()
returns integer
language sql
security definer
set search_path to 'public'
as $$
  with c as (
    update orders
       set status = 'cancelado',
           payment_status = 'cancelled',
           cancelled_at = now(),
           cancellation_reason = 'Pix do totem não pago a tempo'
     where source = 'totem'
       and status = 'aguardando_pagamento'
       and payment_status = 'pending'
       and created_at < now() - interval '30 minutes'
    returning 1
  )
  select count(*)::int from c;
$$;
revoke all on function public.cancel_stale_totem_orders() from public, anon, authenticated;

select cron.schedule('cancel-stale-totem-orders', '*/10 * * * *', $$select public.cancel_stale_totem_orders()$$);
