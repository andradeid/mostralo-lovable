-- Avisos de status do pedido ao cliente pelo WhatsApp da loja (26/11/2026).
-- Mesmo modelo dos avisos de encomenda/agendamento: o banco detecta a mudança, registra uma vez
-- por pedido e etapa (order_schedule_notifications, kind = 'status_<evento>') e chama a função
-- order-status-whatsapp, que monta o texto da loja (whatsapp_auto_messages) e envia pela UaZapi.
-- Só dispara se a loja ligou a automação e aquele aviso e tem WhatsApp conectado. Sem cópia no chat ao vivo.

create or replace function public._order_status_whatsapp()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'net'
as $$
declare
  v_event text;
  v_cfg jsonb;
  v_phone text;
  v_id uuid;
begin
  if tg_op = 'INSERT' then
    if new.status::text in ('entrada', 'aguardando_pagamento') then v_event := 'order_received'; end if;
  elsif old.status is distinct from new.status then
    -- aguardando_pagamento -> entrada (pagamento aprovado) não gera aviso: o "recebido" já saiu
    v_event := case new.status::text
      when 'confirmado' then 'order_confirmed'
      when 'em_preparo' then 'order_confirmed'
      when 'aguarda_retirada' then 'order_ready'
      when 'em_transito' then 'order_in_transit'
      when 'concluido' then 'order_completed'
      when 'cancelado' then 'order_cancelled'
    end;
  end if;
  if v_event is null then return null; end if;

  select to_jsonb(a) into v_cfg from public.whatsapp_auto_messages a
   where a.store_id = new.store_id and a.is_enabled limit 1;
  if v_cfg is null or coalesce((v_cfg ->> (v_event || '_enabled'))::boolean, false) = false then
    return null;
  end if;

  -- Encomenda com o fluxo de agendamento ligado já manda a própria confirmação
  if v_event = 'order_confirmed' and new.scheduled_for is not null and exists (
    select 1 from public.store_order_schedule_settings st where st.store_id = new.store_id and st.flow_enabled
  ) then
    return null;
  end if;

  if not exists (
    select 1 from public.whatsapp_instances w
     where w.store_id = new.store_id and w.provider = 'uazapi' and w.status::text = 'connected'
       and w.api_token is not null and w.instance_name <> 'master-whatsapp-instance'
  ) then
    return null;
  end if;

  v_phone := public._phone_br(new.customer_phone);
  if v_phone is null then return null; end if;

  insert into public.order_schedule_notifications(store_id, order_id, kind, phone, status)
  values (new.store_id, new.id, 'status_' || v_event, v_phone, 'pending')
  on conflict (order_id, kind) where order_id is not null do nothing
  returning id into v_id;
  if v_id is null then return null; end if; -- já avisado nesta etapa

  perform net.http_post(
    url := 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/order-status-whatsapp',
    body := jsonb_build_object('notification_id', v_id),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 20000
  );
  return null;
exception when others then
  raise warning '[order-status-whatsapp] %', sqlerrm;
  return null;
end $$;

revoke all on function public._order_status_whatsapp() from public, anon, authenticated;

drop trigger if exists trg_order_status_whatsapp on public.orders;
create trigger trg_order_status_whatsapp
  after insert or update of status on public.orders
  for each row execute function public._order_status_whatsapp();

-- Tipos aceitos no registro de avisos
alter table public.order_schedule_notifications drop constraint if exists order_schedule_notifications_kind_check;
alter table public.order_schedule_notifications add constraint order_schedule_notifications_kind_check
  check (kind = any (array['confirmation','day_before','before','reschedule','store_summary',
    'status_order_received','status_order_confirmed','status_order_ready','status_order_in_transit',
    'status_order_completed','status_order_cancelled']::text[]));
